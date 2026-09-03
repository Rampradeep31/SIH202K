import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "raw")

print("--- User Dataset Ingestion Engine ---")
print(f"Scanning `{RAW_DIR}` for datasets...")

found_files = []
for root, dirs, files in os.walk(RAW_DIR):
    for f in files:
        if f != "README.md":
            found_files.append(os.path.join(root, f))

print(f"Found {len(found_files)} files in raw input folders.")
for f in found_files:
    rel_path = os.path.relpath(f, RAW_DIR)
    print(f" - [INGESTING] {rel_path}")

print("\nRebuilding unified spatial master and dataset metadata...")
subprocess.run(["python", os.path.join(BASE_DIR, "scripts", "harmonize_tn_dataset.py")], check=True)

print("Ingestion & Master Index Update Completed!")
