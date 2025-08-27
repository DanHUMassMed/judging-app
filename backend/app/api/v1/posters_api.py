# authenticate.py
import os
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.utils.jwt_util import get_token_subject
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Example data
class Poster(BaseModel):
    id: int
    title: str
    author: str
    score: float

fake_db = {
    "1": [
        Poster(id=1, title="01 Neural Networks in C. elegans", author="Alice", score=95.5),
        Poster(id=2, title="02 Autophagy Pathways", author="Bob", score=88.0),
        Poster(id=3, title="03 Mitochondrial Stress", author="Charlie", score=92.3),
        Poster(id=4, title="04 Neural Networks in C. elegans", author="Alice", score=95.5),
        Poster(id=5, title="05 Autophagy Pathways", author="Bob", score=88.0),
        Poster(id=6, title="06 Mitochondrial Stress", author="Charlie", score=92.3),
        Poster(id=7, title="07 Neural Networks in C. elegans", author="Alice", score=95.5),
        Poster(id=8, title="08 Autophagy Pathways", author="Bob", score=88.0),
        Poster(id=9, title="09 Mitochondrial Stress", author="Charlie", score=92.3),
        Poster(id=10, title="10 Neural Networks in C. elegans", author="Alice", score=95.5),
        Poster(id=11, title="11 Autophagy Pathways", author="Bob", score=88.0),
        Poster(id=12, title="12 Mitochondrial Stress", author="Charlie", score=92.3),
    ],
    "4": [
        Poster(id=1, title="xxxNeural Networks in C. elegans", author="Alice", score=95.5),
        Poster(id=2, title="xxxAutophagy Pathways", author="Bob", score=88.0),
        Poster(id=3, title="xxxMitochondrial Stress", author="Charlie", score=92.3),
    ],
}

# ------------------ READ (GET with pagination) ------------------
@router.get("/posters")
async def get_posters(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    user_id: str = Depends(get_token_subject),
):
    posters = fake_db.get(user_id, [])
    total = len(posters)

    start = (page - 1) * limit
    end = start + limit
    paginated = posters[start:end]

    return {"data": paginated, "total": total}

# ------------------ UPDATE (PUT) ------------------
@router.put("/posters/{poster_id}")
async def update_poster(
    poster_id: int,
    updated: Poster,
    user_id: str = Depends(get_token_subject),
):
    posters = fake_db.get(user_id, [])
    for i, poster in enumerate(posters):
        if poster.id == poster_id:
            fake_db[user_id][i] = updated
            # Return full paginated data after update
            total = len(posters)
            return {"data": fake_db[user_id], "total": total}
    raise HTTPException(status_code=404, detail="Poster not found")

# ------------------ DELETE ------------------
@router.delete("/posters/{poster_id}")
async def delete_poster(
    poster_id: int,
    user_id: str = Depends(get_token_subject),
):
    posters = fake_db.get(user_id, [])
    for i, poster in enumerate(posters):
        if poster.id == poster_id:
            deleted = fake_db[user_id].pop(i)
            total = len(fake_db[user_id])
            return {"data": fake_db[user_id], "total": total, "deleted": deleted}
    raise HTTPException(status_code=404, detail="Poster not found")