"""Phoneme to Viseme Mapping Module
Provides rule-based mapping from phonemes to visemes for facial animation
"""

from typing import List, Dict, Tuple
import numpy as np

# Standard viseme definitions based on Disney/Oculus/ARKit blendshapes
VISEME_MAP = {
    # Silence
    'sil': {'jawOpen': 0.0, 'mouthClose': 1.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},
    
    # Vowels
    'AA': {'jawOpen': 0.7, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},  # father
    'AE': {'jawOpen': 0.5, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.4, 'mouthFunnel': 0.0},  # cat
    'AH': {'jawOpen': 0.4, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},  # hut
    'AO': {'jawOpen': 0.6, 'mouthClose': 0.0, 'mouthPucker': 0.3, 'mouthSmile': 0.0, 'mouthFunnel': 0.2},  # caught
    'EH': {'jawOpen': 0.4, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.3, 'mouthFunnel': 0.0},  # bed
    'ER': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.2, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},  # bird
    'IH': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.5, 'mouthFunnel': 0.0},  # bit
    'IY': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.7, 'mouthFunnel': 0.0},  # beat
    'UH': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.3, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},  # book
    'UW': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.7, 'mouthSmile': 0.0, 'mouthFunnel': 0.4},  # boot
    
    # Consonants
    'B': {'jawOpen': 0.0, 'mouthClose': 1.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # big
    'P': {'jawOpen': 0.0, 'mouthClose': 1.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # pin
    'M': {'jawOpen': 0.0, 'mouthClose': 1.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # mat
    'F': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # fun
    'V': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # van
    'TH': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},  # thin
    'S': {'jawOpen': 0.1, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.3, 'mouthFunnel': 0.0},   # sit
    'Z': {'jawOpen': 0.1, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.3, 'mouthFunnel': 0.0},   # zip
    'SH': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.4, 'mouthSmile': 0.0, 'mouthFunnel': 0.3},  # ship
    'CH': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.4, 'mouthSmile': 0.0, 'mouthFunnel': 0.3},  # chip
    'T': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # tip
    'D': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # dip
    'N': {'jawOpen': 0.2, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # nip
    'L': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.2, 'mouthFunnel': 0.0},   # lip
    'R': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.3, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # rip
    'K': {'jawOpen': 0.4, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # kit
    'G': {'jawOpen': 0.4, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.0, 'mouthFunnel': 0.0},   # get
    'W': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.6, 'mouthSmile': 0.0, 'mouthFunnel': 0.4},   # wet
    'Y': {'jawOpen': 0.3, 'mouthClose': 0.0, 'mouthPucker': 0.0, 'mouthSmile': 0.5, 'mouthFunnel': 0.0},   # yet
}


class PhonemeMapper:
    """Maps phonemes to viseme blendshapes for facial animation"""
    
    def __init__(self):
        self.viseme_map = VISEME_MAP
    
    def text_to_phonemes(self, text: str) -> List[Tuple[str, float, float]]:
        """Simple text to phoneme conversion with timing
        Returns: List of (phoneme, start_time, duration)
        """
        # Simplified: map common letter patterns to phonemes
        # In production, use proper phonetic library or ASR
        words = text.upper().split()
        phonemes = []
        time_offset = 0.0
        
        for word in words:
            word_phonemes = self._word_to_phonemes(word)
            for phoneme in word_phonemes:
                duration = 0.08  # ~80ms per phoneme (average)
                phonemes.append((phoneme, time_offset, duration))
                time_offset += duration
            # Add pause between words
            phonemes.append(('sil', time_offset, 0.1))
            time_offset += 0.1
        
        return phonemes
    
    def _word_to_phonemes(self, word: str) -> List[str]:
        """Convert word to phoneme sequence (simplified)"""
        phonemes = []
        i = 0
        word = word.upper()
        
        while i < len(word):
            # Check for digraphs first
            if i < len(word) - 1:
                digraph = word[i:i+2]
                if digraph == 'TH':
                    phonemes.append('TH')
                    i += 2
                    continue
                elif digraph == 'SH':
                    phonemes.append('SH')
                    i += 2
                    continue
                elif digraph == 'CH':
                    phonemes.append('CH')
                    i += 2
                    continue
            
            # Single letters
            char = word[i]
            if char == 'A':
                phonemes.append('AE')
            elif char == 'E':
                phonemes.append('EH')
            elif char == 'I':
                phonemes.append('IH')
            elif char == 'O':
                phonemes.append('AO')
            elif char == 'U':
                phonemes.append('AH')
            elif char in 'BPMFVSZTDNLRKGWY':
                phonemes.append(char)
            
            i += 1
        
        return phonemes
    
    def phoneme_to_viseme(self, phoneme: str) -> Dict[str, float]:
        """Convert single phoneme to viseme blendshape weights"""
        # Return default if phoneme not found
        return self.viseme_map.get(phoneme, self.viseme_map['sil'])
    
    def generate_animation_sequence(self, text: str, fps: int = 30) -> List[Dict]:
        """Generate full animation sequence from text
        
        Args:
            text: Input text to animate
            fps: Frames per second for animation
            
        Returns:
            List of frame data with blendshape weights and timestamps
        """
        phonemes = self.text_to_phonemes(text)
        frames = []
        
        # Calculate total duration
        total_duration = phonemes[-1][1] + phonemes[-1][2] if phonemes else 0
        frame_duration = 1.0 / fps
        num_frames = int(total_duration / frame_duration) + 1
        
        for frame_idx in range(num_frames):
            current_time = frame_idx * frame_duration
            
            # Find active phoneme at current time
            active_phoneme = 'sil'
            for phoneme, start_time, duration in phonemes:
                if start_time <= current_time < start_time + duration:
                    active_phoneme = phoneme
                    break
            
            # Get viseme weights
            viseme = self.phoneme_to_viseme(active_phoneme)
            
            # Add frame data
            frames.append({
                'frame': frame_idx,
                'time': current_time,
                'phoneme': active_phoneme,
                'blendshapes': viseme
            })
        
        return frames
    
    def analyze_audio_features(self, audio_data: np.ndarray, sample_rate: int) -> List[Dict]:
        """Analyze audio to extract phoneme-like features
        
        Args:
            audio_data: Audio samples as numpy array
            sample_rate: Sample rate of audio
            
        Returns:
            List of frame data with estimated visemes
        """
        # Simple energy-based analysis
        frame_size = int(sample_rate * 0.03)  # 30ms frames
        hop_size = int(sample_rate * 0.01)    # 10ms hop
        
        frames = []
        num_frames = (len(audio_data) - frame_size) // hop_size
        
        for i in range(num_frames):
            start_idx = i * hop_size
            end_idx = start_idx + frame_size
            frame_audio = audio_data[start_idx:end_idx]
            
            # Calculate energy
            energy = np.sqrt(np.mean(frame_audio ** 2))
            
            # Simple heuristic: map energy to jaw opening
            # This is very simplified - real system would use ML
            if energy < 0.01:
                phoneme = 'sil'
            elif energy < 0.05:
                phoneme = 'M'  # Closed mouth sounds
            elif energy < 0.15:
                phoneme = 'EH'  # Medium opening
            else:
                phoneme = 'AA'  # Wide opening
            
            viseme = self.phoneme_to_viseme(phoneme)
            
            frames.append({
                'frame': i,
                'time': i * hop_size / sample_rate,
                'phoneme': phoneme,
                'energy': float(energy),
                'blendshapes': viseme
            })
        
        return frames
