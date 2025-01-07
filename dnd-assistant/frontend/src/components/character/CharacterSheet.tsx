import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { characters } from '../../services/api';

interface Character {
  _id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  proficiencies: string[];
  equipment: string[];
  features: string[];
}

const CharacterSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [editedCharacter, setEditedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchCharacter();
  }, [id]);

  const fetchCharacter = async () => {
    try {
      setLoading(true);
      const response = await characters.get(id!);
      setCharacter(response);
      setEditedCharacter(response);
    } catch (error: any) {
      console.error('Error fetching character:', error);
      setError(error.response?.data?.message || 'Failed to fetch character');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedCharacter({ ...character! });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCharacter(character);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await characters.update(id!, editedCharacter!);
      setCharacter(editedCharacter);
      setIsEditing(false);
      setError(null);
    } catch (error: any) {
      console.error('Error saving character:', error);
      setError(error.response?.data?.message || 'Failed to save character');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setEditedCharacter(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleStatChange = (stat: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedCharacter(prev => ({
      ...prev!,
      stats: {
        ...prev!.stats,
        [stat]: numValue
      }
    }));
  };

  const calculateModifier = (stat: number) => {
    return Math.floor((stat - 10) / 2);
  };

  const handleSectionClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      handleEdit();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!character || !editedCharacter) {
    return (
      <Container>
        <Alert severity="error">Character not found</Alert>
      </Container>
    );
  }

  const displayCharacter = isEditing ? editedCharacter : character;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        sx={{ 
          p: 4, 
          position: 'relative',
          cursor: isEditing ? 'default' : 'pointer',
          '&:hover': {
            bgcolor: isEditing ? 'transparent' : 'action.hover'
          }
        }} 
        onClick={handleSectionClick}
      >
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
          {!isEditing ? (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveLoading}
              >
                Save
              </Button>
            </>
          )}
        </Box>

        {/* Header */}
        {isEditing ? (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={displayCharacter.name}
              onChange={(e) => handleChange('name', e.target.value)}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Race"
                  value={displayCharacter.race}
                  onChange={(e) => handleChange('race', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Class"
                  value={displayCharacter.class}
                  onChange={(e) => handleChange('class', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Level"
                  type="number"
                  value={displayCharacter.level}
                  onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            <Typography variant="h4" gutterBottom>
              {displayCharacter.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Level {displayCharacter.level} {displayCharacter.race} {displayCharacter.class}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Core Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Object.entries(displayCharacter.stats).map(([stat, value]) => (
            <Grid item xs={6} sm={4} md={2} key={stat}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase' }}>
                  {stat}
                </Typography>
                {isEditing ? (
                  <TextField
                    type="number"
                    value={value}
                    onChange={(e) => handleStatChange(stat, e.target.value)}
                    inputProps={{ min: 1, max: 20 }}
                    sx={{ my: 1 }}
                  />
                ) : (
                  <>
                    <Typography variant="h4">{value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {calculateModifier(value) >= 0 ? '+' : ''}{calculateModifier(value)}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Combat Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2">Hit Points</Typography>
              {isEditing ? (
                <TextField
                  type="number"
                  value={displayCharacter.hitPoints}
                  onChange={(e) => handleChange('hitPoints', parseInt(e.target.value) || 0)}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography variant="h5">
                  {displayCharacter.hitPoints} / {displayCharacter.maxHitPoints}
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2">Armor Class</Typography>
              {isEditing ? (
                <TextField
                  type="number"
                  value={displayCharacter.armorClass}
                  onChange={(e) => handleChange('armorClass', parseInt(e.target.value) || 0)}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography variant="h5">{displayCharacter.armorClass}</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Features and Equipment */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Proficiencies
            </Typography>
            <Paper elevation={1} sx={{ p: 2 }}>
              {character.proficiencies.map((prof, index) => (
                <Typography key={index} variant="body2" gutterBottom>
                  • {prof}
                </Typography>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Equipment
            </Typography>
            <Paper elevation={1} sx={{ p: 2 }}>
              {character.equipment.map((item, index) => (
                <Typography key={index} variant="body2" gutterBottom>
                  • {item}
                </Typography>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Features
            </Typography>
            <Paper elevation={1} sx={{ p: 2 }}>
              {character.features.map((feature, index) => (
                <Typography key={index} variant="body2" gutterBottom>
                  • {feature}
                </Typography>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CharacterSheet; 