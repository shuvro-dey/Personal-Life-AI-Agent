import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.shopping import ShoppingList, ShoppingItem
from app.models.audit import AuditLog
from app.schemas.shopping import (
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListSummaryResponse,
    ShoppingListDetailResponse,
    ShoppingItemCreate,
    ShoppingItemUpdate,
    ShoppingItemResponse,
    SmartParseRequest,
    SmartParseResponse,
    BatchAddItemsRequest
)
from app.api.deps import get_current_user
from app.services.ai_service import parse_shopping_items

router = APIRouter(prefix="/shopping", tags=["Shopping Manager"])


def calculate_list_cost(items: List[ShoppingItem]) -> float:
    """Deterministically calculate total estimated cost from items with prices."""
    total = 0.0
    for item in items:
        if item.price is not None and item.price > 0:
            total += float(item.price) * float(item.quantity)
    return round(total, 2)


@router.get("/lists", response_model=List[ShoppingListSummaryResponse])
def get_shopping_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all shopping lists belonging to the current user."""
    lists = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.id).order_by(ShoppingList.updated_at.desc()).all()
    results = []
    for s_list in lists:
        items = s_list.items
        item_count = len(items)
        checked_count = sum(1 for item in items if item.is_checked)
        total_cost = calculate_list_cost(items)
        results.append(
            ShoppingListSummaryResponse(
                id=s_list.id,
                user_id=s_list.user_id,
                title=s_list.title,
                item_count=item_count,
                checked_count=checked_count,
                total_cost=total_cost,
                created_at=s_list.created_at,
                updated_at=s_list.updated_at
            )
        )
    return results


@router.post("/lists", response_model=ShoppingListSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_list(
    payload: ShoppingListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new shopping list."""
    new_list = ShoppingList(
        user_id=current_user.id,
        title=payload.title.strip()
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="shopping_list_created",
        details_json=json.dumps({"list_id": new_list.id, "title": new_list.title}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return ShoppingListSummaryResponse(
        id=new_list.id,
        user_id=new_list.user_id,
        title=new_list.title,
        item_count=0,
        checked_count=0,
        total_cost=0.0,
        created_at=new_list.created_at,
        updated_at=new_list.updated_at
    )


@router.get("/lists/{list_id}", response_model=ShoppingListDetailResponse)
def get_shopping_list_detail(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific shopping list and its items, enforcing user isolation."""
    s_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not s_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    items = db.query(ShoppingItem).filter(
        ShoppingItem.list_id == list_id,
        ShoppingItem.user_id == current_user.id
    ).order_by(ShoppingItem.is_checked.asc(), ShoppingItem.id.asc()).all()

    item_count = len(items)
    checked_count = sum(1 for item in items if item.is_checked)
    total_cost = calculate_list_cost(items)

    return ShoppingListDetailResponse(
        id=s_list.id,
        user_id=s_list.user_id,
        title=s_list.title,
        item_count=item_count,
        checked_count=checked_count,
        total_cost=total_cost,
        items=[ShoppingItemResponse.model_validate(it) for it in items],
        created_at=s_list.created_at,
        updated_at=s_list.updated_at
    )


@router.put("/lists/{list_id}", response_model=ShoppingListSummaryResponse)
def rename_shopping_list(
    list_id: int,
    payload: ShoppingListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename a shopping list."""
    s_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not s_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    s_list.title = payload.title.strip()
    db.commit()
    db.refresh(s_list)

    items = s_list.items
    return ShoppingListSummaryResponse(
        id=s_list.id,
        user_id=s_list.user_id,
        title=s_list.title,
        item_count=len(items),
        checked_count=sum(1 for i in items if i.is_checked),
        total_cost=calculate_list_cost(items),
        created_at=s_list.created_at,
        updated_at=s_list.updated_at
    )


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a shopping list and all its items."""
    s_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not s_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    title = s_list.title
    db.delete(s_list)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="shopping_list_deleted",
        details_json=json.dumps({"list_id": list_id, "title": title}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return None


@router.post("/lists/{list_id}/items", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_item(
    list_id: int,
    payload: ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a single item to a shopping list."""
    s_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not s_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    new_item = ShoppingItem(
        user_id=current_user.id,
        list_id=list_id,
        name=payload.name.strip(),
        quantity=payload.quantity,
        unit=payload.unit.strip(),
        price=payload.price,
        is_checked=payload.is_checked
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return ShoppingItemResponse.model_validate(new_item)


@router.put("/items/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    item_id: int,
    payload: ShoppingItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update item details or toggle checked status."""
    item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )

    if payload.name is not None and payload.name.strip():
        item.name = payload.name.strip()
    if payload.quantity is not None:
        item.quantity = payload.quantity
    if payload.unit is not None and payload.unit.strip():
        item.unit = payload.unit.strip()
    if payload.price is not None:
        item.price = payload.price
    if payload.is_checked is not None:
        item.is_checked = payload.is_checked

    db.commit()
    db.refresh(item)
    return ShoppingItemResponse.model_validate(item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an item from a shopping list."""
    item = db.query(ShoppingItem).filter(
        ShoppingItem.id == item_id,
        ShoppingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )

    db.delete(item)
    db.commit()
    return None


@router.post("/smart-parse", response_model=SmartParseResponse)
def smart_parse_shopping_text(
    payload: SmartParseRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Parse natural text in Bangla or English into structured items.
    Returns preview data for user verification before persisting to database.
    """
    result = parse_shopping_items(text=payload.text, language=payload.language or current_user.preferred_language)
    return SmartParseResponse(items=result.get("items", []))


@router.post("/lists/{list_id}/batch-add", response_model=List[ShoppingItemResponse], status_code=status.HTTP_201_CREATED)
def batch_add_shopping_items(
    list_id: int,
    payload: BatchAddItemsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm and persist user-approved preview items into a shopping list."""
    s_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.user_id == current_user.id
    ).first()
    if not s_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    created_items = []
    for item_data in payload.items:
        new_item = ShoppingItem(
            user_id=current_user.id,
            list_id=list_id,
            name=item_data.name.strip(),
            quantity=item_data.quantity,
            unit=item_data.unit.strip(),
            price=item_data.price,
            is_checked=item_data.is_checked
        )
        db.add(new_item)
        created_items.append(new_item)

    db.commit()
    for item in created_items:
        db.refresh(item)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="shopping_items_batch_added",
        details_json=json.dumps({"list_id": list_id, "count": len(created_items)}),
        status="success"
    )
    db.add(audit)
    db.commit()

    return [ShoppingItemResponse.model_validate(it) for it in created_items]
