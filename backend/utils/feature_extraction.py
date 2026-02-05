"""
URL Feature Extraction Module for Phishing Detection

This module extracts various features from URLs to identify phishing patterns.
Features include URL structure analysis, suspicious pattern detection, and 
domain characteristics.
"""

import re
import math
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any
import tldextract
import validators


class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    # Suspicious keywords commonly found in phishing URLs
    SUSPICIOUS_KEYWORDS = [
        'login', 'signin', 'account', 'verify', 'update', 'secure', 
        'banking', 'confirm', 'password', 'credential', 'suspend',
        'alert', 'urgent', 'expire', 'validate', 'authenticate'
    ]
    
    # Trusted TLDs (Top Level Domains)
    TRUSTED_TLDS = ['.com', '.org', '.net', '.edu', '.gov']
    
    def __init__(self):
        """Initialize the feature extractor"""
        pass
    
    def extract_features(self, url: str) -> Dict[str, Any]:
        """
        Extract all features from a URL
        
        Args:
            url: The URL to analyze
            
        Returns:
            Dictionary containing all extracted features
        """
        features = {}
        
        # Basic validation
        if not validators.url(url):
            # Try adding http:// if missing
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
        
        try:
            parsed = urlparse(url)
            ext = tldextract.extract(url)
            
            # URL Length Features
            features['url_length'] = len(url)
            features['hostname_length'] = len(parsed.netloc)
            features['path_length'] = len(parsed.path)
            
            # Protocol Features
            features['is_https'] = 1 if parsed.scheme == 'https' else 0
            features['has_port'] = 1 if ':' in parsed.netloc and '@' not in parsed.netloc else 0
            
            # Domain Features
            features['has_ip'] = self._has_ip_address(parsed.netloc)
            features['num_dots'] = url.count('.')
            features['num_hyphens'] = url.count('-')
            features['num_underscores'] = url.count('_')
            features['num_slashes'] = url.count('/')
            features['num_at_symbols'] = url.count('@')
            features['num_ampersands'] = url.count('&')
            features['num_question_marks'] = url.count('?')
            features['num_equals'] = url.count('=')
            
            # Subdomain Features
            features['num_subdomains'] = len(ext.subdomain.split('.')) if ext.subdomain else 0
            features['subdomain_length'] = len(ext.subdomain) if ext.subdomain else 0
            
            # Domain Characteristics
            features['domain_length'] = len(ext.domain)
            features['has_trusted_tld'] = 1 if f'.{ext.suffix}' in self.TRUSTED_TLDS else 0
            
            # Suspicious Pattern Detection
            features['num_suspicious_keywords'] = self._count_suspicious_keywords(url.lower())
            features['has_suspicious_keywords'] = 1 if features['num_suspicious_keywords'] > 0 else 0
            
            # URL Entropy (randomness measure)
            features['url_entropy'] = self._calculate_entropy(url)
            
            # Special Characters Ratio
            special_chars = sum([url.count(c) for c in '!@#$%^&*()_+-=[]{}|;:,.<>?'])
            features['special_char_ratio'] = special_chars / len(url) if len(url) > 0 else 0
            
            # Digit Ratio
            digit_count = sum(c.isdigit() for c in url)
            features['digit_ratio'] = digit_count / len(url) if len(url) > 0 else 0
            
            # Path Features
            features['path_depth'] = len([p for p in parsed.path.split('/') if p])
            
            # Query Parameters
            query_params = parse_qs(parsed.query)
            features['num_query_params'] = len(query_params)
            
            # Shortening Service Detection
            shortening_services = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly']
            features['is_shortened'] = 1 if any(service in url.lower() for service in shortening_services) else 0
            
            # Double Slash in Path
            features['double_slash_in_path'] = 1 if '//' in parsed.path else 0
            
            # Prefix/Suffix in Domain
            features['has_hyphen_in_domain'] = 1 if '-' in ext.domain else 0
            
        except Exception as e:
            # If parsing fails, return default features
            print(f"Error extracting features from URL: {e}")
            features = self._get_default_features()
        
        return features
    
    def _has_ip_address(self, netloc: str) -> int:
        """Check if the URL uses an IP address instead of domain name"""
        # Remove port if present
        host = netloc.split(':')[0]
        
        # IPv4 pattern
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if re.match(ipv4_pattern, host):
            return 1
        
        # IPv6 pattern (simplified)
        if '[' in host and ']' in host:
            return 1
        
        return 0
    
    def _count_suspicious_keywords(self, url: str) -> int:
        """Count number of suspicious keywords in URL"""
        count = 0
        for keyword in self.SUSPICIOUS_KEYWORDS:
            if keyword in url:
                count += 1
        return count
    
    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text (measure of randomness)"""
        if not text:
            return 0.0
        
        # Calculate character frequency
        char_freq = {}
        for char in text:
            char_freq[char] = char_freq.get(char, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        text_len = len(text)
        for count in char_freq.values():
            probability = count / text_len
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def _get_default_features(self) -> Dict[str, Any]:
        """Return default feature values for invalid URLs"""
        return {
            'url_length': 0,
            'hostname_length': 0,
            'path_length': 0,
            'is_https': 0,
            'has_port': 0,
            'has_ip': 0,
            'num_dots': 0,
            'num_hyphens': 0,
            'num_underscores': 0,
            'num_slashes': 0,
            'num_at_symbols': 0,
            'num_ampersands': 0,
            'num_question_marks': 0,
            'num_equals': 0,
            'num_subdomains': 0,
            'subdomain_length': 0,
            'domain_length': 0,
            'has_trusted_tld': 0,
            'num_suspicious_keywords': 0,
            'has_suspicious_keywords': 0,
            'url_entropy': 0.0,
            'special_char_ratio': 0.0,
            'digit_ratio': 0.0,
            'path_depth': 0,
            'num_query_params': 0,
            'is_shortened': 0,
            'double_slash_in_path': 0,
            'has_hyphen_in_domain': 0
        }
    
    def get_feature_names(self) -> list:
        """Return list of all feature names in order"""
        return list(self._get_default_features().keys())


# Example usage
if __name__ == "__main__":
    extractor = URLFeatureExtractor()
    
    # Test with phishing URL
    phishing_url = "http://secure-login-update.com/verify/account?id=47281"
    features = extractor.extract_features(phishing_url)
    
    print("Phishing URL Features:")
    print(f"URL: {phishing_url}")
    for key, value in features.items():
        print(f"  {key}: {value}")
    
    print("\n" + "="*50 + "\n")
    
    # Test with legitimate URL
    legit_url = "https://www.google.com/search?q=cybersecurity"
    features = extractor.extract_features(legit_url)
    
    print("Legitimate URL Features:")
    print(f"URL: {legit_url}")
    for key, value in features.items():
        print(f"  {key}: {value}")
