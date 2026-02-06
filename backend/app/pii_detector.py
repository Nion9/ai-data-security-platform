import spacy
import pandas as pd
import re
from typing import List, Dict, Any, Optional
import io
import json

class PIIDetector:
    def __init__(self):
        """Initialize PII detector with spaCy NLP model"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # If model not found, download it
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            self.nlp = spacy.load("en_core_web_sm")
    
    def detect_pii_in_text(self, text: str) -> List[Dict[str, Any]]:
        """Detect PII in a text string using spaCy NER"""
        if not text or not isinstance(text, str):
            return []
        
        doc = self.nlp(text)
        pii_entities = []
        
        # Map spaCy entity labels to PII categories
        pii_categories = {
            "PERSON": "Name",
            "GPE": "Location",
            "LOC": "Location",
            "ORG": "Organization",
            "EMAIL": "Email",
            "PHONE": "Phone",
            "DATE": "Date",
            "TIME": "Time"
        }
        
        for ent in doc.ents:
            if ent.label_ in pii_categories:
                pii_entities.append({
                    "text": ent.text,
                    "type": pii_categories[ent.label_],
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "confidence": 0.95  # spaCy doesn't provide confidence scores
                })
        
        # Additional regex patterns for specific PII types
        pii_entities.extend(self._detect_email(text))
        pii_entities.extend(self._detect_phone(text))
        pii_entities.extend(self._detect_ssn(text))
        pii_entities.extend(self._detect_credit_card(text))
        
        return pii_entities
    
    def _detect_email(self, text: str) -> List[Dict[str, Any]]:
        """Detect email addresses using regex"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = []
        for match in re.finditer(email_pattern, text):
            emails.append({
                "text": match.group(),
                "type": "Email",
                "label": "EMAIL",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.99
            })
        return emails
    
    def _detect_phone(self, text: str) -> List[Dict[str, Any]]:
        """Detect phone numbers using regex"""
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US format
            r'\b\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b'  # International
        ]
        phones = []
        for pattern in phone_patterns:
            for match in re.finditer(pattern, text):
                phones.append({
                    "text": match.group(),
                    "type": "Phone",
                    "label": "PHONE",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.90
                })
        return phones
    
    def _detect_ssn(self, text: str) -> List[Dict[str, Any]]:
        """Detect Social Security Numbers"""
        ssn_pattern = r'\b\d{3}[-]?\d{2}[-]?\d{4}\b'
        ssns = []
        for match in re.finditer(ssn_pattern, text):
            ssns.append({
                "text": match.group(),
                "type": "SSN",
                "label": "SSN",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.98
            })
        return ssns
    
    def _detect_credit_card(self, text: str) -> List[Dict[str, Any]]:
        """Detect credit card numbers"""
        cc_pattern = r'\b(?:\d{4}[-\s]?){3}\d{4}\b'
        ccs = []
        for match in re.finditer(cc_pattern, text):
            cc_num = match.group().replace(' ', '').replace('-', '')
            if self._luhn_check(cc_num):
                ccs.append({
                    "text": match.group(),
                    "type": "Credit Card",
                    "label": "CREDIT_CARD",
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.85
                })
        return ccs
    
    def _luhn_check(self, card_num: str) -> bool:
        """Luhn algorithm to validate credit card numbers"""
        def digits_of(n):
            return [int(d) for d in str(n)]
        digits = digits_of(card_num)
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]
        checksum = sum(odd_digits)
        for d in even_digits:
            checksum += sum(digits_of(d*2))
        return checksum % 10 == 0
    
    def analyze_csv(self, file_content: bytes) -> Dict[str, Any]:
        """Analyze CSV file for PII"""
        try:
            # Read CSV
            df = pd.read_csv(io.BytesIO(file_content))
            results = {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "columns": [],
                "pii_summary": {}
            }
            
            pii_count = 0
            pii_by_type = {}
            
            # Analyze each column
            for column in df.columns:
                col_data = df[column].astype(str).fillna('')
                col_pii = []
                
                # Sample first 100 rows for analysis (for performance)
                sample_size = min(100, len(col_data))
                for i, value in enumerate(col_data.head(sample_size)):
                    if value and value != 'nan':
                        detected = self.detect_pii_in_text(str(value))
                        if detected:
                            col_pii.extend(detected)
                            pii_count += len(detected)
                            for pii in detected:
                                pii_type = pii["type"]
                                pii_by_type[pii_type] = pii_by_type.get(pii_type, 0) + 1
                
                # Check if column name suggests PII
                column_name_lower = str(column).lower()
                suspected_types = []
                if any(keyword in column_name_lower for keyword in ['email', 'mail']):
                    suspected_types.append("Email")
                if any(keyword in column_name_lower for keyword in ['phone', 'mobile', 'tel']):
                    suspected_types.append("Phone")
                if any(keyword in column_name_lower for keyword in ['name', 'first', 'last', 'full']):
                    suspected_types.append("Name")
                if any(keyword in column_name_lower for keyword in ['address', 'city', 'state', 'zip']):
                    suspected_types.append("Location")
                if any(keyword in column_name_lower for keyword in ['ssn', 'social']):
                    suspected_types.append("SSN")
                
                results["columns"].append({
                    "name": column,
                    "dtype": str(df[column].dtype),
                    "sample_values": df[column].head(5).tolist(),
                    "pii_detected": col_pii[:10],  # Limit to 10 examples
                    "suspected_types": suspected_types,
                    "pii_count": len(col_pii)
                })
            
            results["pii_summary"] = {
                "total_pii": pii_count,
                "by_type": pii_by_type,
                "pii_percentage": (pii_count / (len(df) * len(df.columns)) * 100) if len(df) > 0 else 0
            }
            
            return results
            
        except Exception as e:
            raise ValueError(f"Error analyzing CSV: {str(e)}")
    
    def clean_data(self, df: pd.DataFrame, action: str = "redact", columns: List[str] = None) -> pd.DataFrame:
        """Clean/redact PII data in DataFrame"""
        df_clean = df.copy()
        
        if columns is None:
            columns = df.columns.tolist()
        
        redaction_char = "█"
        
        for column in columns:
            if column not in df.columns:
                continue
                
            if action == "remove":
                df_clean = df_clean.drop(column, axis=1)
            elif action in ["redact", "anonymize"]:
                for idx, value in enumerate(df[column]):
                    if pd.notna(value) and value != '':
                        text = str(value)
                        pii_entities = self.detect_pii_in_text(text)
                        
                        if pii_entities:
                            if action == "redact":
                                # Redact detected PII
                                redacted_text = text
                                for pii in sorted(pii_entities, key=lambda x: x['start'], reverse=True):
                                    start, end = pii['start'], pii['end']
                                    redacted_text = redacted_text[:start] + redaction_char * (end - start) + redacted_text[end:]
                                df_clean.at[idx, column] = redacted_text
                            elif action == "anonymize":
                                # Replace with generic placeholder
                                df_clean.at[idx, column] = f"[{pii_entities[0]['type']}_REDACTED]"
        
        return df_clean