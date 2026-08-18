import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Upload, Database, FileText, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

export default function ImportDatasetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importMethod, setImportMethod] = useState('json'); // 'json' or 'file'

  // Get current dataset stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['import-stats'],
    queryFn: async () => {
      const response = await fetch('/api/import-dataset');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Import dataset mutation
  const importMutation = useMutation({
    mutationFn: async (profiles) => {
      const response = await fetch('/api/import-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles }),
      });
      if (!response.ok) throw new Error('Failed to import dataset');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['import-stats'] });
      queryClient.invalidateQueries({ queryKey: ['face-profiles'] });
      
      Alert.alert(
        'Import Complete',
        data.message,
        [{ text: 'OK' }]
      );
      
      setJsonInput('');
      setSelectedFile(null);
    },
    onError: (error) => {
      Alert.alert('Import Failed', error.message);
    },
  });

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setImportMethod('file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  }, []);

  const handleImport = useCallback(async () => {
    try {
      let profiles;

      if (importMethod === 'json' && jsonInput.trim()) {
        profiles = JSON.parse(jsonInput.trim());
      } else if (importMethod === 'file' && selectedFile) {
        // Read file content (this would need to be implemented based on your file reading preference)
        Alert.alert('File Import', 'File import feature needs file reading implementation');
        return;
      } else {
        Alert.alert('Error', 'Please provide dataset in JSON format or select a file');
        return;
      }

      if (!Array.isArray(profiles)) {
        Alert.alert('Error', 'Dataset must be an array of profiles');
        return;
      }

      importMutation.mutate(profiles);
    } catch (error) {
      Alert.alert('Error', 'Invalid JSON format');
    }
  }, [importMethod, jsonInput, selectedFile, importMutation]);

  const sampleDataset = `[
  {
    "name": "John Doe",
    "person_type": "normal",
    "images": [
      {
        "angle": "front",
        "image_url": "data:image/jpeg;base64,/9j/4AAQ...",
        "features": {
          "skin_tone": "medium",
          "eye_color": "brown"
        }
      },
      {
        "angle": "left",
        "image_url": "data:image/jpeg;base64,/9j/4AAQ..."
      },
      {
        "angle": "right", 
        "image_url": "https://example.com/image.jpg"
      }
    ]
  },
  {
    "name": "Jane Smith",
    "person_type": "criminal",
    "images": [
      {
        "angle": "front",
        "image_url": "data:image/jpeg;base64,/9j/4AAQ..."
      }
    ]
  }
]`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{ 
        paddingTop: insets.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.9)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>
          Import Dataset
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Current Stats */}
        {stats && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Current Database
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#ccc', fontSize: 14 }}>Profiles:</Text>
              <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '600' }}>
                {stats.stats.total_profiles}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#ccc', fontSize: 14 }}>Face Images:</Text>
              <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '600' }}>
                {stats.stats.total_images}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#ccc', fontSize: 14 }}>Detections:</Text>
              <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '600' }}>
                {stats.stats.total_detections}
              </Text>
            </View>
          </View>
        )}

        {/* Import Method Selection */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20,
        }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Import Method
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setImportMethod('json')}
              style={{
                flex: 1,
                backgroundColor: importMethod === 'json' ? '#007AFF' : 'rgba(255,255,255,0.1)',
                paddingHorizontal: 15,
                paddingVertical: 12,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                JSON Text
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setImportMethod('file')}
              style={{
                flex: 1,
                backgroundColor: importMethod === 'file' ? '#007AFF' : 'rgba(255,255,255,0.1)',
                paddingHorizontal: 15,
                paddingVertical: 12,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                JSON File
              </Text>
            </TouchableOpacity>
          </View>

          {importMethod === 'json' && (
            <View>
              <Text style={{ color: '#fff', fontSize: 16, marginBottom: 10 }}>
                Paste your JSON dataset:
              </Text>
              <TextInput
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: 15,
                  height: 200,
                  textAlignVertical: 'top',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
                placeholder={sampleDataset}
                placeholderTextColor="#666"
                value={jsonInput}
                onChangeText={setJsonInput}
                multiline
              />
            </View>
          )}

          {importMethod === 'file' && (
            <View>
              <TouchableOpacity
                onPress={pickFile}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: selectedFile ? '#007AFF' : '#666',
                  borderStyle: 'dashed',
                }}
              >
                <Upload size={32} color={selectedFile ? '#007AFF' : '#666'} />
                <Text style={{ 
                  color: selectedFile ? '#007AFF' : '#666', 
                  fontSize: 16, 
                  marginTop: 10,
                  textAlign: 'center' 
                }}>
                  {selectedFile ? selectedFile.name : 'Select JSON File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dataset Format Info */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 15,
          padding: 20,
          marginBottom: 20,
        }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
            Expected Format
          </Text>
          
          <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 10 }}>
            Your dataset should be a JSON array with this structure:
          </Text>
          
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            padding: 15,
          }}>
            <Text style={{ 
              color: '#44FF44', 
              fontSize: 12, 
              fontFamily: 'monospace'
            }}>
              {`• name (required): Person's full name
• person_type: "normal", "staff", or "criminal"  
• images (required): Array of face images
  - angle: "left", "right", or "front"
  - image_url: URL or base64 data
  - features: Optional detected features`}
            </Text>
          </View>
          
          <Text style={{ color: '#FFAA00', fontSize: 12, marginTop: 10 }}>
            💡 Images will be automatically analyzed for facial features if not provided
          </Text>
        </View>

        {/* Import Button */}
        <TouchableOpacity
          onPress={handleImport}
          disabled={importMutation.isLoading || (!jsonInput.trim() && !selectedFile)}
          style={{
            backgroundColor: '#007AFF',
            padding: 18,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (importMutation.isLoading || (!jsonInput.trim() && !selectedFile)) ? 0.6 : 1,
          }}
        >
          <Database size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            {importMutation.isLoading ? 'Importing...' : 'Import Dataset'}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 15 }}>
          This will add new profiles to your existing database
        </Text>
      </ScrollView>
    </View>
  );
}