import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Box,
  Fab,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  CardActionArea
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { characters } from '../../services/api';

interface Character {
  _id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hitPoints: number;
  maxHitPoints: number;
}

const CharacterList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await characters.getAll();
      setCharacterList(response);
    } catch (error: any) {
      console.error('Error fetching characters:', error);
      setError(error.response?.data?.message || 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await characters.delete(characterId);
      await fetchCharacters();
    } catch (error: any) {
      console.error('Error deleting character:', error);
      setError(error.response?.data?.message || 'Failed to delete character');
    }
  };

  const handleCreateCharacter = () => {
    navigate('/characters/create');
  };

  const handleEditCharacter = (characterId: string) => {
    navigate(`/characters/${characterId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '80vh', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Characters
      </Typography>

      {characterList.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            No characters found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCharacter}
          >
            Create Your First Character
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {characterList.map((character) => (
            <Grid item xs={12} sm={6} md={4} key={character._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}>
                <CardActionArea onClick={() => handleEditCharacter(character._id)}>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {character.name}
                    </Typography>
                    <Typography color="text.secondary">
                      Level {character.level} {character.race} {character.class}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      HP: {character.hitPoints}/{character.maxHitPoints}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleEditCharacter(character._id)}
                  >
                    Edit
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCharacter(character._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {characterList.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateCharacter}
          sx={{
            position: 'fixed',
            bottom: theme.spacing(4),
            right: theme.spacing(4),
          }}
        >
          <AddIcon />
        </Fab>
      )}

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
    </Box>
  );
};

export default CharacterList; 