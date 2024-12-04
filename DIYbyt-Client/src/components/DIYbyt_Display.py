#!/usr/bin/env python3
import sys
sys.path.append("/usr/local/lib/python3.11/dist-packages/")

from rgbmatrix import RGBMatrix, RGBMatrixOptions
from PIL import Image
import requests
import time
import io
import json
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_matrix():
    options = RGBMatrixOptions()
    options.rows = 32
    options.cols = 64
    options.gpio_slowdown = 4
    options.disable_hardware_pulsing = True
    
    return RGBMatrix(options=options)

def get_gif_from_server(url):
    try:
        logger.info(f"Fetching from {url}")
        response = requests.get(url)
        if response.status_code == 200:
            content = response.content
            logger.debug(f"Got content of length: {len(content)}")
            image = Image.open(io.BytesIO(content))
            logger.debug(f"Image format: {image.format}, size: {image.size}, frames: {getattr(image, 'n_frames', 1)}")
            return image
        else:
            logger.error(f"Failed to fetch GIF: {response.status_code}")
            logger.error(f"Response content: {response.text[:200]}")
            return None
    except Exception as e:
        logger.error(f"Error fetching GIF: {e}", exc_info=True)
        return None

def display_gif(matrix, gif, duration, duration_unit):
    """
    Display a GIF based on duration settings:
    - duration_unit "loops": play specified number of complete loops
    - duration_unit "seconds": display for specified number of seconds
    """
    try:
        if duration_unit == "loops":
            logger.info(f"Displaying for {duration} loops")
            for _ in range(int(duration)):
                for frame in range(gif.n_frames):
                    gif.seek(frame)
                    rgb_frame = gif.convert('RGB')
                    rgb_frame = rgb_frame.resize((matrix.width, matrix.height))
                    matrix.SetImage(rgb_frame)
                    frame_duration = gif.info.get('duration', 100) / 1000.0
                    time.sleep(frame_duration)
        else:  # seconds
            logger.info(f"Displaying for {duration} seconds")
            start_time = time.time()
            while time.time() - start_time < float(duration):
                for frame in range(gif.n_frames):
                    if time.time() - start_time >= float(duration):
                        break
                    gif.seek(frame)
                    rgb_frame = gif.convert('RGB')
                    rgb_frame = rgb_frame.resize((matrix.width, matrix.height))
                    matrix.SetImage(rgb_frame)
                    frame_duration = gif.info.get('duration', 100) / 1000.0
                    time.sleep(frame_duration)
                    
    except KeyboardInterrupt:
        logger.info("Display stopped by user")
        raise
    except Exception as e:
        logger.error(f"Error displaying GIF: {e}", exc_info=True)

def load_program_metadata(metadata_path):
    """Load and parse program metadata, returning server URL and enabled programs sorted by order"""
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Get server URL from config (with fallback)
        server_url = metadata.get('_config', {}).get('render_server_url', 'http://localhost:8000')
        
        # Filter enabled programs and add slot numbers
        enabled_programs = []
        for program_name, config in metadata.items():
            # Skip the _config entry
            if program_name == '_config':
                continue
                
            if config.get('enabled', False):
                slot_number = len(enabled_programs)  # Assign sequential slot numbers
                program_config = {
                    'name': program_name,
                    'duration': config.get('duration', '30'),
                    'durationUnit': config.get('durationUnit', 'seconds'),
                    'order': config.get('order', 999),  # Default to end if no order specified
                    'slot': f'slot{slot_number}.gif'
                }
                enabled_programs.append(program_config)
        
        # Sort by order value
        return server_url, sorted(enabled_programs, key=lambda x: x['order'])
    
    except Exception as e:
        logger.error(f"Error loading metadata: {e}", exc_info=True)
        return 'http://localhost:8000', []  # Return default URL and empty list on error

def main():
    logger.info("Initializing matrix...")
    matrix = setup_matrix()
    logger.info("Matrix initialized")
    
    # Configuration
    METADATA_PATH = Path("star_programs/program_metadata.json")  # Update with your path
    
    while True:
        try:
            # Load current program configuration and server URL
            server_url, programs = load_program_metadata(METADATA_PATH)
            logger.info(f"Using render server: {server_url}")
            
            if not programs:
                logger.warning("No enabled programs found")
                time.sleep(5)
                continue
            
            # Cycle through enabled programs in order
            for program in programs:
                logger.info(f"\nDisplaying program: {program['name']}")
                gif_url = f"{server_url}/gifs/{program['slot']}"
                
                gif = get_gif_from_server(gif_url)
                if gif:
                    display_gif(
                        matrix,
                        gif,
                        duration=program['duration'],
                        duration_unit=program['durationUnit']
                    )
                else:
                    logger.error(f"Failed to get GIF for {program['name']}")
                    time.sleep(5)
                
        except KeyboardInterrupt:
            logger.info("\nExiting...")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}", exc_info=True)
            time.sleep(5)

if __name__ == "__main__":
    main()