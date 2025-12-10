import os
from dotenv import load_dotenv
from typing import List, Dict, Any
from app.services.product_service import get_products
from app.embeddings.chroma_client import get_chroma_client
from app.services.product_service import clear_cache
from huggingface_hub import InferenceClient


client = InferenceClient(token=os.getenv("HUGGINGFACEHUB_API_KEY"))

def create_embeddings(texts: List[str]) -> List[List[float]]:
  """Generate embeddings using HuggingFace Inference API"""
  embeddings = []

  for text in texts:
      response = client.feature_extraction(
          text=text,
          model="sentence-transformers/all-MiniLM-L6-v2"
      )
      embeddings.append(response[0])
   
  return embeddings

def create_product_document(product: Dict[str, Any]) -> str:
    """
    Convert product data into a text document for embedding.
    
    Args:
        product: Product dictionary from API
    
    Returns:
        str: Formatted text combining product fields
    """
    title = product.get("title", "")
    description = product.get("description", "")
    category = product.get("category", "")
    price = product.get("price", "")
    
    # Combine fields into searchable text
    document = f"Product: {title}. Category: {category}. Description: {description}. Price: ${price}"
    return document

async def embed_and_products():
    """ 
    Fetch products, create documents, generate embeddings, and store them. 
    """
    products = await get_products()
    if not products:
        print("No products found to embed.")
        return
    
    collection = get_chroma_client()
    documents = []
    metadatas = []
    ids = []

    # Process each product into a text document
    for product in products:
        product_id = str(product.get('id'))

        # Create document from product data
        doc_text = create_product_document(product)
        documents.append(doc_text)

        # Store metadata for retrival
        metadatas.append({
            'product_id': product_id,
            'title': product.get('title', ''),
            'price': str(product.get('price', '')),
            'category': product.get('category', ''),
            'image': product.get('image', ''),
            'description': product.get('description', '')
        })

        ids.append(f"product_{product_id}")

        # Generate embeddings using HuggingFace API
        print(f"Generating embeddings for {len(documents)} products...")
        embeddings = create_embeddings(documents)

        # Store embeddings in ChromaDB
        collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Successfully embedded and stored {len(documents)} products in ChromaDB.")

async def refresh_embedddings():
    """
    Force refresh products and recreate embeddings.
    """
    clear_cache()

    # Re-embed products and sttore
    await embed_and_products()
    print("Product embeddings refreshed successfully.")