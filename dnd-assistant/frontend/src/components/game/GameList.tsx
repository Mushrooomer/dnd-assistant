import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  useTheme,
  useMediaQuery,
  Fab,
  CircularProgress,
  CardActionArea,
  IconButton,
  Alert,
  Snackbar,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { game, adventures, characters } from '../../services/api';
import { RootState } from '../../store/store';

interface Character {
  _id: string;
  name: string;
  race: string;
  class: string;
  level: number;
}

interface Adventure {
  _id: string;
  title: string;
  description: string;
  startingLevel: number;
  endingLevel: number;
  setting: string;
}

interface Game {
  _id: string;
  name: string;
  description: string;
  status: string;
  dungeon_master: {
    _id: string;
    username: string;
  };
}

const GameList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [games, setGames] = useState<Game[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const [availableAdventures, setAvailableAdventures] = useState<Adventure[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [newGame, setNewGame] = useState({
    name: '',
    description: '',
    adventureId: '',
    characterId: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchAdventures();
    fetchCharacters();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await game.getGames();
      setGames(response);
    } catch (error: any) {
      console.error('Error fetching games:', error);
      setError(error.response?.data?.message || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdventures = async () => {
    try {
      const response = await adventures.getAll();
      setAvailableAdventures(response);
    } catch (error: any) {
      console.error('Error fetching adventures:', error);
      setError(error.response?.data?.message || 'Failed to fetch adventures');
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await characters.getAll();
      setAvailableCharacters(response);
    } catch (error: any) {
      console.error('Error fetching characters:', error);
      setError(error.response?.data?.message || 'Failed to fetch characters');
    }
  };

  const handleCreateGame = async () => {
    try {
      setIsCreating(true);
      const response = await game.createSession(newGame);
      setOpen(false);
      setNewGame({ name: '', description: '', adventureId: '', characterId: '' });
      await fetchGames();
      // Navigate to the new game session
      navigate(`/games/${response._id}`);
    } catch (error: any) {
      console.error('Error creating game:', error);
      setError(error.response?.data?.message || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (gameId: string) => {
    setGameToDelete(gameId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;

    try {
      await game.deleteGame(gameToDelete);
      setDeleteConfirmOpen(false);
      setGameToDelete(null);
      await fetchGames();
    } catch (error: any) {
      console.error('Error deleting game:', error);
      setError(error.response?.data?.message || 'Failed to delete game');
    }
  };

  const handleJoinGame = (gameId: string) => {
    navigate(`/games/${gameId}`);
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
        Your Games
      </Typography>

      {games.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            No games found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Create Your First Game
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}>
                <CardActionArea onClick={() => handleJoinGame(game._id)}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {game.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      DM: {game.dungeon_master.username}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {game.description}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      Status: {game.status}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleJoinGame(game._id)}
                  >
                    Join Game
                  </Button>
                  {game.dungeon_master._id === userId && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(game._id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Button for creating new game */}
      {games.length > 0 && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: theme.spacing(4),
            right: theme.spacing(4),
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create Game Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Game Name"
            fullWidth
            value={newGame.name}
            onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={2}
            value={newGame.description}
            onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
          />
          <TextField
            select
            margin="dense"
            label="Select Adventure"
            fullWidth
            value={newGame.adventureId}
            onChange={(e) => setNewGame({ ...newGame, adventureId: e.target.value })}
            helperText="Choose the adventure you want to play"
          >
            {availableAdventures.map((adventure) => (
              <MenuItem key={adventure._id} value={adventure._id}>
                <Box>
                  <Typography variant="subtitle1">
                    {adventure.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Levels {adventure.startingLevel}-{adventure.endingLevel} • {adventure.setting}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
          {newGame.adventureId && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {availableAdventures.find(a => a._id === newGame.adventureId)?.description}
              </Typography>
            </Box>
          )}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Choose Your Character
            </Typography>
            {availableCharacters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography color="text.secondary" gutterBottom>
                  No characters available
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/characters/create')}
                  startIcon={<AddIcon />}
                >
                  Create New Character
                </Button>
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                label="Select Character"
                value={newGame.characterId}
                onChange={(e) => setNewGame({ ...newGame, characterId: e.target.value })}
                helperText="Choose a character for this adventure"
              >
                {availableCharacters.map((character) => (
                  <MenuItem key={character._id} value={character._id}>
                    <Box>
                      <Typography variant="subtitle2">
                        {character.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Level {character.level} {character.race} {character.class}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGame} 
            variant="contained" 
            color="primary"
            disabled={!newGame.name || !newGame.adventureId || !newGame.characterId || isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : null}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Game</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this game? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
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

export default GameList; 