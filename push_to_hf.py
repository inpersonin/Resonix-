import os
import sys
from huggingface_hub import HfApi

def deploy():
    # 1. Verify credentials from environment variables
    token = os.getenv("HF_TOKEN")
    space_id = os.getenv("HF_SPACE_ID")

    print("=========================================")
    print("      Resonix HF Space Deployer          ")
    print("=========================================")

    if not token:
        print("[-] Error: HF_TOKEN environment variable not set.")
        print("    Please set it with: $env:HF_TOKEN = 'your_token'")
        sys.exit(1)

    if not space_id:
        print("[-] Error: HF_SPACE_ID environment variable not set.")
        print("    Please set it with: $env:HF_SPACE_ID = 'your_username/resonix'")
        sys.exit(1)

    api = HfApi(token=token)

    # 2. Check/Create Space repo on Hugging Face
    print(f"[+] Verifying Space repository: {space_id}...")
    try:
        api.create_repo(
            repo_id=space_id,
            repo_type="space",
            space_sdk="docker",
            private=False,
            exist_ok=True
        )
        print("[+] Space repository initialized/confirmed successfully.")
    except Exception as e:
        print(f"[-] Warning during repo check: {e}")

    # 3. Upload files recursively, ignoring dev directories
    print("[+] Uploading application folder to Space...")
    try:
        api.upload_folder(
            folder_path=".",
            repo_id=space_id,
            repo_type="space",
            ignore_patterns=[
                ".git*",
                ".venv*",
                "*__pycache__*",
                "*.log",
                "*node_modules*",
                "stitch_resonix_*",
                "push_to_hf.py"
            ]
        )
        print("[+] Upload completed successfully!")
        username, space_name = space_id.split("/")
        print(f"[+] Your web app is building at: https://huggingface.co/spaces/{username}/{space_name}")
    except Exception as e:
        print(f"[-] Upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    deploy()
