"""Audio Processing Module
Handles audio data processing and feature extraction
"""

import numpy as np
import base64
import io
from typing import Dict, List, Tuple


class AudioProcessor:
    """Process audio data for animation generation"""
    
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
    
    def decode_audio_base64(self, audio_base64: str) -> np.ndarray:
        """Decode base64 audio to numpy array
        
        Args:
            audio_base64: Base64 encoded audio data (PCM16)
            
        Returns:
            Audio samples as numpy array
        """
        # Remove data URL prefix if present
        if ',' in audio_base64:
            audio_base64 = audio_base64.split(',')[1]
        
        # Decode base64
        audio_bytes = base64.b64decode(audio_base64)
        
        # Convert to numpy array (assuming 16-bit PCM)
        audio_data = np.frombuffer(audio_bytes, dtype=np.int16)
        
        # Normalize to [-1, 1]
        audio_data = audio_data.astype(np.float32) / 32768.0
        
        return audio_data
    
    def extract_envelope(self, audio_data: np.ndarray, window_size: int = 512) -> np.ndarray:
        """Extract amplitude envelope from audio
        
        Args:
            audio_data: Audio samples
            window_size: Window size for envelope extraction
            
        Returns:
            Envelope values
        """
        # Apply absolute value and smooth
        envelope = np.abs(audio_data)
        
        # Simple moving average
        if len(envelope) > window_size:
            kernel = np.ones(window_size) / window_size
            envelope = np.convolve(envelope, kernel, mode='same')
        
        return envelope
    
    def detect_voice_activity(self, audio_data: np.ndarray, threshold: float = 0.02) -> List[Tuple[int, int]]:
        """Detect voice activity regions
        
        Args:
            audio_data: Audio samples
            threshold: Energy threshold for voice detection
            
        Returns:
            List of (start_idx, end_idx) tuples for voice regions
        """
        # Calculate energy
        frame_size = int(self.sample_rate * 0.02)  # 20ms frames
        hop_size = frame_size // 2
        
        energy = []
        for i in range(0, len(audio_data) - frame_size, hop_size):
            frame = audio_data[i:i+frame_size]
            energy.append(np.sqrt(np.mean(frame ** 2)))
        
        # Find voice regions
        is_voice = np.array(energy) > threshold
        
        regions = []
        start_idx = None
        
        for i, active in enumerate(is_voice):
            if active and start_idx is None:
                start_idx = i * hop_size
            elif not active and start_idx is not None:
                end_idx = i * hop_size
                regions.append((start_idx, end_idx))
                start_idx = None
        
        # Handle case where voice continues to end
        if start_idx is not None:
            regions.append((start_idx, len(audio_data)))
        
        return regions
    
    def calculate_rms(self, audio_data: np.ndarray) -> float:
        """Calculate RMS (Root Mean Square) of audio"""
        return float(np.sqrt(np.mean(audio_data ** 2)))
    
    def normalize_audio(self, audio_data: np.ndarray, target_level: float = 0.3) -> np.ndarray:
        """Normalize audio to target level
        
        Args:
            audio_data: Audio samples
            target_level: Target RMS level
            
        Returns:
            Normalized audio
        """
        current_rms = self.calculate_rms(audio_data)
        
        if current_rms > 0:
            gain = target_level / current_rms
            audio_data = audio_data * gain
            # Clip to prevent overflow
            audio_data = np.clip(audio_data, -1.0, 1.0)
        
        return audio_data
