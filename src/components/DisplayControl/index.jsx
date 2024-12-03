import { useState, useEffect, useCallback } from 'react';
import { List, FileText, Plus, GripVertical, Edit2, X } from 'lucide-react';
import {
  listStarPrograms,
  saveStarProgram,
  saveProgramMetadata,
  loadProgramMetadata
} from '../../api';
import './styles.css';

const StarEditor = ({ isOpen, onClose, program, onSave }) => {
  console.log('StarEditor props:', { isOpen, program });  // Debug log
  const [content, setContent] = useState(program?.content || '');

  useEffect(() => {
    setContent(program?.content || '');
  }, [program]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-3/4 max-w-4xl h-3/4 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Editing {program.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full font-mono text-sm border rounded p-2"
            spellCheck="false"
          />
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(program.id, content);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfigEditor = ({ isOpen, onClose, program, metadata, onSave }) => {
  const [configText, setConfigText] = useState('');

  useEffect(() => {
    if (program && metadata[program.name]?.config) {
      setConfigText(JSON.stringify(metadata[program.name].config, null, 2));
    } else {
      setConfigText('{\n  \n}');
    }
  }, [program, metadata]);

  const handleSave = () => {
    try {
      const configObj = JSON.parse(configText);
      onSave(program.name, configObj);
      onClose();
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-2/3 max-w-2xl h-2/3 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Configure {program?.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            className="w-full h-full font-mono text-sm border rounded p-2"
            spellCheck="false"
            placeholder="Enter JSON configuration"
          />
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateProgramModal = ({ isOpen, onClose, onCreate }) => {
  const [programName, setProgramName] = useState('');
  
  if (!isOpen) return null;
  
  const handleCreate = () => {
    if (programName.trim()) {
      onCreate(`${programName.trim()}.star`, '// New star program\n');
      setProgramName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-96 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Create New Program</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <label className="block text-sm text-gray-500 mb-1">Program Name</label>
          <div className="flex items-center">
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="flex-1 border rounded-l p-2"
              placeholder="Enter program name"
              autoFocus
            />
            <span className="bg-gray-100 text-gray-500 px-2 py-2 border-y border-r rounded-r">
              .star
            </span>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!programName.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
const DisplayControl = () => {
  const [programs, setPrograms] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [configProgram, setConfigProgram] = useState(null);
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const loadedPrograms = await listStarPrograms();
        console.log('Loaded programs:', loadedPrograms); // Debug log
        const loadedMetadata = await loadProgramMetadata();
        
        const programsWithMetadata = loadedPrograms.map(program => ({
          ...program,
          id: Date.now() + Math.random(),
          duration: loadedMetadata[program.name]?.duration || 30,
          durationUnit: loadedMetadata[program.name]?.durationUnit || 'seconds',
          enabled: loadedMetadata[program.name]?.enabled ?? true
        }));

        console.log('Programs with metadata:', programsWithMetadata); // Debug log
        setPrograms(programsWithMetadata);
        setMetadata(loadedMetadata);
      } catch (error) {
        console.error('Failed to load programs:', error);
      }
    };

    loadPrograms();
  }, []);

  useEffect(() => {
    const saveMetadata = async () => {
      try {
        if (Object.keys(metadata).length > 0) {
          await saveProgramMetadata(metadata);
        }
      } catch (error) {
        console.error('Failed to save metadata:', error);
      }
    };
    saveMetadata();
  }, [metadata]);
  const handleSaveConfig = (programName, config) => {
    setMetadata(prev => ({
      ...prev,
      [programName]: {
        ...prev[programName],
        config
      }
    }));
  };
  const handleDragStart = (e, position) => {
    setDraggedItem(programs[position]);
    e.dataTransfer.effectAllowed = 'move';
    const dragGhost = document.createElement('div');
    dragGhost.style.display = 'none';
    document.body.appendChild(dragGhost);
    e.dataTransfer.setDragImage(dragGhost, 0, 0);
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    setDragOverIndex(position);
    
    if (!draggedItem) return;
    
    const items = [...programs];
    const draggedOverItem = items[position];

    if (draggedItem === draggedOverItem) return;

    const newItems = items.filter(item => item.id !== draggedItem.id);
    newItems.splice(position, 0, draggedItem);

    setPrograms(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    const ghostElements = document.querySelectorAll('div[style="display: none;"]');
    ghostElements.forEach(element => element.remove());
  };

  const handleFileUpload = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (file.name.endsWith('.star')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newProgram = {
            id: Date.now() + Math.random(),
            name: file.name,
            content: e.target.result,
            duration: 30,
            durationUnit: 'seconds',
            enabled: true
          };
          console.log('New program being added:', newProgram); // Debug log
          saveStarProgram(file.name, e.target.result);
          setPrograms(prev => [...prev, newProgram]);
          setMetadata(prev => ({
            ...prev,
            [file.name]: {
              duration: 30,
              durationUnit: 'seconds',
              enabled: true
            }
          }));
        };
        reader.readAsText(file);
      } else {
        alert('Please upload only .star files');
      }
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDurationChange = (name, value, unit) => {
    setMetadata(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        duration: value,
        durationUnit: unit || prev[name]?.durationUnit
      }
    }));
    setPrograms(programs.map(p => 
      p.name === name 
        ? { ...p, duration: value, durationUnit: unit || p.durationUnit }
        : p
    ));
  };

  const handleSaveContent = async (programId, newContent) => {
    const program = programs.find(p => p.id === programId);
    if (program) {
      try {
        await saveStarProgram(program.name, newContent);
        setPrograms(programs.map(p => 
          p.id === programId ? { ...p, content: newContent } : p
        ));
      } catch (error) {
        console.error('Failed to save program:', error);
        alert('Failed to save program');
      }
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Display Programs</h2>
        <button 
  onClick={() => setIsCreateModalOpen(true)}
  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
>
  <Plus size={20} /> Add Program
</button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <List size={20} />
            <h3 className="font-semibold">Program Queue</h3>
          </div>
        </div>
        
        <div className="divide-y">
          {programs.map((program, index) => (
            <div 
              key={program.id} 
              className={`p-4 flex items-center gap-4 hover:bg-gray-50 cursor-move transition-colors
                ${dragOverIndex === index ? 'border-t-2 border-blue-500' : ''}
                ${draggedItem?.id === program.id ? 'bg-gray-50 opacity-50' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <GripVertical size={20} className="text-gray-400" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <span className="font-medium">{program.name}</span>
                  <button 
                    onClick={() => {
                      console.log('Setting editing program:', program); // Debug log
                      setEditingProgram(program);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 size={16} className="text-gray-500" />
                  </button>
              
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                  <span className="font-medium">{program.name}</span>
                    <button 
                      onClick={() => {
                        console.log('Setting editing program:', program);
                        setEditingProgram(program);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                <button 
                  onClick={() => setConfigProgram(program)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">Config</span>
                </button>
              </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-sm text-gray-500">Duration</label>
                    <input 
                      type="number" 
                      value={program.duration}
                      onChange={(e) => handleDurationChange(program.name, e.target.value, program.durationUnit)}
                      className="w-20 border rounded p-1"
                    />
                  </div>
                  <select 
                    value={program.durationUnit}
                    onChange={(e) => handleDurationChange(program.name, program.duration, e.target.value)}
                    className="border rounded p-1 h-8"
                  >
                    <option value="seconds">seconds</option>
                    <option value="loops">loops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-500">Enabled</label>
                  <input 
                    type="checkbox" 
                    checked={program.enabled}
                    onChange={(e) => {
                      setMetadata(prev => ({
                        ...prev,
                        [program.name]: {
                          ...prev[program.name],
                          enabled: e.target.checked
                        }
                      }));
                      setPrograms(programs.map(p => 
                        p.name === program.name 
                          ? { ...p, enabled: e.target.checked }
                          : p
                      ));
                    }}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div 
        className="mt-6 border-2 border-dashed rounded-lg p-8 text-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <p className="text-gray-500">Drag and drop .star files here</p>
          <p className="text-sm text-gray-400">or</p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".star"
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
          />
          <label htmlFor="file-upload" className="text-blue-500 hover:underline cursor-pointer">
            browse files
          </label>
        </div>
      </div>

      <StarEditor 
        isOpen={editingProgram !== null}
        onClose={() => setEditingProgram(null)}
        program={editingProgram || {}}
        onSave={handleSaveContent}
      />
      <ConfigEditor 
        isOpen={configProgram !== null}
        onClose={() => setConfigProgram(null)}
        program={configProgram}
        metadata={metadata}
        onSave={handleSaveConfig}
      />  
    <CreateProgramModal 
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onCreate={(name, initialContent) => {
    const newProgram = {
      id: Date.now() + Math.random(),
      name,
      content: initialContent,
      duration: 30,
      durationUnit: 'seconds',
      enabled: true
    };
    saveStarProgram(name, initialContent);
    setPrograms(prev => [...prev, newProgram]);
    setMetadata(prev => ({
      ...prev,
      [name]: {
        duration: 30,
        durationUnit: 'seconds',
        enabled: true
      }
    }));
    setEditingProgram(newProgram);
  }}
/>
    </div>  
  );
};

export default DisplayControl;