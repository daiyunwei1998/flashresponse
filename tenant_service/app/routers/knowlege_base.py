import logging

from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.config import settings
from app.dependencies import get_background_session
# Assuming the VectorStoreManager and other dependencies are already defined
from app.repository.vector_store import VectorStoreManager, OpenAIEmbeddingService, MilvusCollectionService
from app.routers.tenant_doc import get_tenant_docs
from app.schemas.tenant_doc_schema import TenantDocCreateSchema
from app.services.tenant_doc_service import TenantDocService

# Create a router instance for knowledge_base
router = APIRouter(
    prefix="/api/v1/knowledge_base",
    tags=["knowledge_base"]
)

# VectorStoreManager dependency (assuming injected or initialized earlier)
openai_service = OpenAIEmbeddingService(api_key=settings.OPENAI_API_KEY, model = settings.embedding_model)
milvus_service = MilvusCollectionService(host=settings.MILVUS_HOST, port=settings.MILVUS_PORT)
vector_store_manager = VectorStoreManager(openai_service, milvus_service)


# Pydantic models for request/response bodies
class UpdateContentRequest(BaseModel):
    newContent: str


class DocNamesResponse(BaseModel):
    tenantId: str
    docNames: List[str] = []


class UpdateResponse(BaseModel):
    tenantId: str
    entryId: int
    message: str


class Entry(BaseModel):
    id: str
    content: str

class EntriesByDocNameResponse(BaseModel):
    tenantId: str
    docName: str
    entries: List[Entry]

# Pydantic model for the add entry request
class AddEntryRequest(BaseModel):
    content: str = Field(..., description="The content of the entry to be added.")
    docName: str = Field(..., description="The name of the document associated with the entry.")

# Pydantic model for the add entry response
class AddEntryResponse(BaseModel):
    tenantId: str
    docName: str
    message: str


# Update an entry's content identified by ID
@router.put("/{tenantId}/entries/{entryId}", response_model=UpdateResponse)
async def update_entry_by_id(
    update_request: UpdateContentRequest,
    tenantId: str = Path(..., description="The unique ID of the tenant"),
    entryId: int = Path(..., description="The unique ID of the entry to be updated"),

):
    try:
        vector_store_manager.update_entry_by_id(tenantId, entryId, update_request.newContent)
        return {
            "tenantId": tenantId,
            "entryId": entryId,
            "message": "Entry content updated successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a list of entries (content, id) by doc_name
@router.get("/{tenantId}/entries", response_model=EntriesByDocNameResponse)
async def get_entries_by_doc_name(
    tenantId: str = Path(..., description="The unique ID of the tenant"),
    docName: str = Query(..., description="The name of the document to filter entries")
):
    try:
        entries = vector_store_manager.get_entries_by_doc_name(tenantId, docName)
        for entry in entries:
            entry['id'] = str(entry['id'])
        return {
            "tenantId": tenantId,
            "docName": docName,
            "entries": entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete an entry identified by ID
@router.delete("/{tenantId}/entries/{entryId}", response_model=dict)
async def delete_entry_by_id(
    tenantId: str = Path(..., description="The unique ID of the tenant"),
    entryId: str = Path(..., description="The unique ID of the entry to be deleted")
):
    try:
        await vector_store_manager.delete_entry_by_id(tenantId, int(entryId))
        return {
            "tenantId": tenantId,
            "entryId": entryId,
            "message": "Entry deleted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint to add a new entry with a custom doc_name
@router.post("/{tenantId}/entries", response_model=AddEntryResponse, status_code=201)
async def add_entry(
        add_request: AddEntryRequest,
        tenantId: str = Path(..., description="The unique ID of the tenant")
):
    """
    Add a new entry to the knowledge base with a custom doc_name.

    Args:
        tenantId (str): The unique ID of the tenant.
        add_request (AddEntryRequest): The request body containing content and doc_name.

    Returns:
        AddEntryResponse: Confirmation message upon successful addition.
    """
    try:
        async with get_background_session() as session:
            # Check if the TenantDoc already exists
            existing_doc = await TenantDocService.get_tenant_doc(tenantId, add_request.docName, session)

            if existing_doc:
                # If the record exists, increment num_entries
                new_num_entries = existing_doc.num_entries + 1
                await TenantDocService.update_num_entries(existing_doc.id, new_num_entries, session)
            else:
                # If no record exists, create a new TenantDoc record with num_entries set to 1
                tenant_doc_data = TenantDocCreateSchema(
                    tenant_id=tenantId,
                    doc_name=add_request.docName,
                    num_entries=1
                )
                await TenantDocService.create_tenant_doc(tenant_doc_data, session)

        # Process the tenant data by passing content as a list with a single entry
        vector_store_manager.process_tenant_data(
            tenant_id=tenantId,
            content=[add_request.content],
            doc_name=add_request.docName
        )
        return {
            "tenantId": tenantId,
            "docName": add_request.docName,
            "message": "Entry added successfully."
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred while adding the entry.")
