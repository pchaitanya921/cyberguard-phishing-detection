"""
Dataset Preparation Script

This script helps download and prepare phishing and benign URL datasets
for training the machine learning model.
"""

import pandas as pd
import os
from pathlib import Path


def create_sample_dataset():
    """
    Create a sample dataset for initial testing
    
    In production, replace this with actual datasets from:
    - Kaggle: https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls
    - PhishTank: https://www.phishtank.com/developer_info.php
    """
    
    # Sample phishing URLs
    phishing_urls = [
        "http://secure-login-update.com/verify/account?id=47281",
        "http://paypa1-secure.com/signin",
        "http://192.168.1.1/banking/login",
        "http://amazon-account-verify.net/update",
        "http://microsoft-365-login.xyz/confirm",
        "http://secure-bank-update.info/validate",
        "http://apple-id-verify.online/signin",
        "http://netflix-payment-update.site/billing",
        "http://facebook-security-alert.com/verify",
        "http://google-account-suspend.net/restore",
        "http://wellsfargo-secure.online/banking/signin",
        "http://chase-bank-verify.info/account/update",
        "http://citibank-alert.net/secure/login",
        "http://bankofamerica-verify.com/signin",
        "http://usbank-secure.online/update",
        "http://paypal-billing-update.net/confirm",
        "http://amazon-prime-renew.info/payment",
        "http://ebay-account-suspend.com/verify",
        "http://instagram-verify.online/account",
        "http://twitter-security.net/confirm",
    ]
    
    # Sample benign URLs
    benign_urls = [
        "https://www.google.com/search",
        "https://www.amazon.com/products",
        "https://www.facebook.com/",
        "https://www.youtube.com/watch",
        "https://www.wikipedia.org/wiki/Main_Page",
        "https://www.reddit.com/r/programming",
        "https://www.github.com/explore",
        "https://www.stackoverflow.com/questions",
        "https://www.linkedin.com/feed",
        "https://www.twitter.com/home",
        "https://www.netflix.com/browse",
        "https://www.microsoft.com/windows",
        "https://www.apple.com/iphone",
        "https://www.bbc.com/news",
        "https://www.cnn.com/world",
        "https://www.nytimes.com/section/technology",
        "https://www.medium.com/topics/technology",
        "https://www.forbes.com/business",
        "https://www.techcrunch.com/startups",
        "https://www.wired.com/category/security",
    ]
    
    # Create DataFrames
    phishing_df = pd.DataFrame({
        'url': phishing_urls,
        'label': 1  # 1 = Phishing
    })
    
    benign_df = pd.DataFrame({
        'url': benign_urls,
        'label': 0  # 0 = Legitimate
    })
    
    # Combine and shuffle
    combined_df = pd.concat([phishing_df, benign_df], ignore_index=True)
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save to CSV
    data_dir = Path(__file__).parent.parent / 'data' / 'raw'
    data_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = data_dir / 'sample_urls.csv'
    combined_df.to_csv(output_path, index=False)
    
    print(f"✅ Sample dataset created: {output_path}")
    print(f"   Total URLs: {len(combined_df)}")
    print(f"   Phishing: {len(phishing_df)}")
    print(f"   Legitimate: {len(benign_df)}")
    print("\n⚠️  NOTE: This is a SMALL sample dataset for testing.")
    print("   For production, download larger datasets from:")
    print("   - Kaggle: https://www.kaggle.com/datasets/taruntiwarihp/phishing-site-urls")
    print("   - PhishTank: https://www.phishtank.com/developer_info.php")
    
    return output_path


def load_dataset(filepath: str = None):
    """Load dataset from CSV file"""
    if filepath is None:
        data_dir = Path(__file__).parent.parent / 'data' / 'raw'
        filepath = data_dir / 'sample_urls.csv'
    
    if not os.path.exists(filepath):
        print(f"Dataset not found at {filepath}")
        print("Creating sample dataset...")
        filepath = create_sample_dataset()
    
    df = pd.read_csv(filepath)
    print(f"✅ Loaded dataset: {filepath}")
    print(f"   Shape: {df.shape}")
    print(f"   Columns: {df.columns.tolist()}")
    
    return df


if __name__ == "__main__":
    # Create sample dataset
    create_sample_dataset()
