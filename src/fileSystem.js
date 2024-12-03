import fs from 'fs';
import path from 'path';

// Base directory for star programs
const STAR_PROGRAMS_DIR = './star_programs';

// Ensure the directory exists
const initializeFileSystem = () => {
  if (!fs.existsSync(STAR_PROGRAMS_DIR)) {
    fs.mkdirSync(STAR_PROGRAMS_DIR, { recursive: true });
  }
};

// List all .star files
const listStarPrograms = () => {
  try {
    const files = fs.readdirSync(STAR_PROGRAMS_DIR);
    return files.filter(file => file.endsWith('.star')).map(file => ({
      name: file,
      path: path.join(STAR_PROGRAMS_DIR, file),
      content: fs.readFileSync(path.join(STAR_PROGRAMS_DIR, file), 'utf8')
    }));
  } catch (error) {
    console.error('Error listing star programs:', error);
    return [];
  }
};

// Save a star program
const saveStarProgram = (name, content) => {
  try {
    const filePath = path.join(STAR_PROGRAMS_DIR, name);
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error('Error saving star program:', error);
    return false;
  }
};

// Delete a star program
const deleteStarProgram = (name) => {
  try {
    const filePath = path.join(STAR_PROGRAMS_DIR, name);
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting star program:', error);
    return false;
  }
};

// Update program order/metadata
const saveProgramMetadata = (metadata) => {
  try {
    fs.writeFileSync(
      path.join(STAR_PROGRAMS_DIR, 'program_metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    return true;
  } catch (error) {
    console.error('Error saving program metadata:', error);
    return false;
  }
};

// Load program metadata
const loadProgramMetadata = () => {
  try {
    const metadataPath = path.join(STAR_PROGRAMS_DIR, 'program_metadata.json');
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    return {};
  } catch (error) {
    console.error('Error loading program metadata:', error);
    return {};
  }
};

export {
  initializeFileSystem,
  listStarPrograms,
  saveStarProgram,
  deleteStarProgram,
  saveProgramMetadata,
  loadProgramMetadata
};