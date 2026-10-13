"""Regenerate board-data.js from the supplied map's *visible* hex borders."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('detect-grid.py')),run_name='__main__')
