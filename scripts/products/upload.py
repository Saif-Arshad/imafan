import csv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
import os

# MongoDB Atlas connection string
uri = "mongodb+srv://admin:hello!23@cluster0.gz59t.mongodb.net/imafan?retryWrites=true&w=majority"

# MongoDB Database and Collection names
db_name = "imafan"
brand_collection_name = "brands"
quality_collection_name = "qualities"
product_collection_name = "products"

# Path to your CSV file
file_path = "C:\Projects\Express Projects\imafan\scripts\products\inventory.csv"  # Replace with the actual file path


def upload_data():
    client = MongoClient(uri)

    try:
        # Connect to MongoDB Atlas
        db = client[db_name]
        brand_collection = db[brand_collection_name]
        quality_collection = db[quality_collection_name]
        product_collection = db[product_collection_name]
        print("Connected to MongoDB")

        # Read data from CSV
        products = []
        brands_set = set()
        qualities_set = set()

        with open(file_path, mode="r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                model = row.get("Model")
                brand = row.get("Brand")
                quality = row.get("Quality")
                quantity = int(
                    row.get("Quantity", 0)
                )  # Assuming there's a 'Quantity' column

                if not model:
                    print("Skipping row with missing model.")
                    continue

                if brand:
                    brands_set.add(brand.strip())
                if quality:
                    qualities_set.add(quality.strip())

                product = {
                    "phoneModel": model.strip(),
                    "phoneBrand": (
                        brand.strip() if brand else None
                    ),  # Temporarily store brand name
                    "quality": (
                        quality.strip() if quality else None
                    ),  # Temporarily store quality name
                    "quantity": quantity,
                }

                products.append(product)

        # Insert unique brands
        brand_name_to_id = {}
        for brand in brands_set:
            try:
                result = brand_collection.insert_one({"name": brand})
                brand_name_to_id[brand] = result.inserted_id
                print(f"Inserted brand: {brand}")
            except DuplicateKeyError:
                # Brand already exists, retrieve its ObjectId
                existing_brand = brand_collection.find_one({"name": brand})
                if existing_brand:
                    brand_name_to_id[brand] = existing_brand["_id"]
                    print(f"Brand already exists: {brand}")
                else:
                    print(f"Error retrieving existing brand: {brand}")

        # Insert unique qualities
        quality_name_to_id = {}
        for quality in qualities_set:
            try:
                result = quality_collection.insert_one({"name": quality})
                quality_name_to_id[quality] = result.inserted_id
                print(f"Inserted quality: {quality}")
            except DuplicateKeyError:
                # Quality already exists, retrieve its ObjectId
                existing_quality = quality_collection.find_one({"name": quality})
                if existing_quality:
                    quality_name_to_id[quality] = existing_quality["_id"]
                    print(f"Quality already exists: {quality}")
                else:
                    print(f"Error retrieving existing quality: {quality}")

        # Prepare Product documents with ObjectId references
        product_documents = []
        for product in products:
            phoneBrand_id = (
                brand_name_to_id.get(product["phoneBrand"])
                if product["phoneBrand"]
                else None
            )
            quality_id = (
                quality_name_to_id.get(product["quality"])
                if product["quality"]
                else None
            )

            product_doc = {
                "phoneModel": product["phoneModel"],
                "phoneBrand": phoneBrand_id,
                "quality": quality_id,
                "quantity": product["quantity"],
            }

            product_documents.append(product_doc)

        if product_documents:
            result = product_collection.insert_many(product_documents)
            print(f"{len(result.inserted_ids)} products were uploaded to MongoDB")
        else:
            print("No products to upload.")

    except Exception as e:
        print(f"Error uploading data to MongoDB: {e}")
    finally:
        # Close the connection to MongoDB
        client.close()
        print("MongoDB connection closed")


# Run the upload function
if __name__ == "__main__":
    upload_data()
