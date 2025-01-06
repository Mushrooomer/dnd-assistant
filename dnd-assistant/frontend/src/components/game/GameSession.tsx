import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  ListItemButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import CasinoIcon from '@mui/icons-material/Casino';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useParams, useNavigate } from 'react-router-dom';
import { game } from '../../services/api';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'dm' | 'player' | 'system' | 'roll';
}

interface ActionAnalysis {
  needsRoll: boolean;
  diceType: string | null;
  skillCheck: string | null;
  advantage: boolean;
  disadvantage: boolean;
}

const GameSession: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { gameId } = useParams<{ gameId: string }>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [rollDialogOpen, setRollDialogOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState({
    diceType: 'd20',
    reason: ''
  });

  const commonRolls = [
    { type: 'd20', label: 'D20 (Ability Checks, Attacks)' },
    { type: 'd12', label: 'D12' },
    { type: 'd10', label: 'D10' },
    { type: 'd8', label: 'D8' },
    { type: 'd6', label: 'D6' },
    { type: 'd4', label: 'D4' }
  ];

  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) {
        setError('No game ID provided');
        return;
      }

      try {
        const gameData = await game.getSession(gameId);
        if (!gameData || !Array.isArray(gameData.messages)) {
          throw new Error('Invalid game data received');
        }
        setMessages(gameData.messages || []);
      } catch (error: any) {
        console.error('Error loading game:', error);
        setError(error.response?.data?.message || 'Failed to load game');
        // Optionally navigate back to game list if game load fails
        // navigate('/games');
      }
    };

    loadGame();
  }, [gameId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !gameId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await game.sendMessage(gameId, message);
      setMessage('');
      
      if (!response || !Array.isArray(response.messages)) {
        throw new Error('Invalid response from server');
      }

      // Add all messages from the response
      const newMessages = response.messages.map((msg: any) => ({
        ...msg,
        id: Date.now().toString(),
        timestamp: new Date()
      }));
      
      setMessages(prev => [...prev, ...newMessages]);

      // Handle action analysis if present
      if (response.actionAnalysis) {
        handleActionAnalysis(response.actionAnalysis);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'System',
        content: 'Error: Could not process your message. Please try again.',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionAnalysis = (analysis: ActionAnalysis) => {
    try {
      if (analysis.needsRoll) {
        const rollMessage = `You need to make a ${analysis.skillCheck || ''} check${
          analysis.diceType ? ` using ${analysis.diceType}` : ''
        }${analysis.advantage ? ' with advantage' : ''}${
          analysis.disadvantage ? ' with disadvantage' : ''
        }.`;

        const systemMessage: Message = {
          id: Date.now().toString(),
          sender: 'System',
          content: rollMessage,
          timestamp: new Date(),
          type: 'system'
        };

        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Error handling action analysis:', error);
    }
  };

  const handleRollDice = async (diceType: string = 'd20', reason?: string) => {
    try {
      if (!gameId) return;
      
      setIsLoading(true);
      const response = await game.rollDice(gameId, diceType, reason);
      
      // Add messages from the response
      if (response.messages) {
        const newMessages = response.messages.map((msg: any) => ({
          ...msg,
          id: Date.now().toString(),
          timestamp: new Date()
        }));
        setMessages(prev => [...prev, ...newMessages]);
      }
    } catch (error) {
      console.error('Error rolling dice:', error);
      setError('Failed to roll dice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollDialogOpen = () => {
    setSelectedRoll({ diceType: 'd20', reason: '' });
    setRollDialogOpen(true);
  };

  const handleRollDialogClose = () => {
    setRollDialogOpen(false);
  };

  const handleRollSubmit = () => {
    handleRollDice(selectedRoll.diceType, selectedRoll.reason);
    handleRollDialogClose();
  };

  const renderMessage = (msg: Message) => {
    try {
      const isPlayer = msg.type === 'player';
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: isPlayer ? 'flex-end' : 'flex-start',
            mb: 2,
          }}
        >
          <Paper
            sx={{
              p: 2,
              maxWidth: '70%',
              backgroundColor: isPlayer ? theme.palette.primary.dark : theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {msg.sender}
            </Typography>
            <Typography variant="body1">{msg.content}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>
      );
    } catch (error) {
      console.error('Error rendering message:', error);
      return null;
    }
  };

  const handleLeaveGame = () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeaveGame = () => {
    setLeaveDialogOpen(false);
    navigate('/games');
  };

  const sidebar = (
    <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <PersonIcon sx={{ mr: 2 }} />
            <ListItemText primary="Character Sheet" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleRollDialogOpen}>
            <CasinoIcon sx={{ mr: 2 }} />
            <ListItemText primary="Roll Dice" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <MapIcon sx={{ mr: 2 }} />
            <ListItemText primary="Map" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Players</Typography>
        <List>
          <ListItem>
            <ListItemText primary="Player 1" secondary="Human Fighter" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Player 2" secondary="Elf Wizard" />
          </ListItem>
        </List>
      </Box>
      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLeaveGame} sx={{ color: 'error.main' }}>
            <ExitToAppIcon sx={{ mr: 2 }} />
            <ListItemText primary="Leave Game" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      height: '100%',
      width: '100%',
      position: 'relative'
    }}>
      {/* Game Tools Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { sm: 250 },
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        {sidebar}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 250,
            position: 'absolute',
            height: '100%',
          },
        }}
      >
        {sidebar}
      </Drawer>

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: { sm: 'none' },
            p: 1,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: 'auto',
            backgroundColor: theme.palette.background.default,
          }}
        >
          {messages.map((msg) => (
            <Box key={msg.id}>{renderMessage(msg)}</Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box
          component="form"
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderTop: 1,
            borderColor: 'divider',
          }}
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="What would you like to do?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                size="small"
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
              >
                Send
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Leave Game Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
      >
        <DialogTitle>Leave Game</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to leave this game? You can rejoin later from the game list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmLeaveGame} color="error" variant="contained">
            Leave Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Roll Dice Dialog */}
      <Dialog open={rollDialogOpen} onClose={handleRollDialogClose}>
        <DialogTitle>Roll Dice</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select Dice Type
            </Typography>
            <Grid container spacing={1}>
              {commonRolls.map((roll) => (
                <Grid item xs={6} key={roll.type}>
                  <Button
                    fullWidth
                    variant={selectedRoll.diceType === roll.type ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRoll(prev => ({ ...prev, diceType: roll.type }))}
                    startIcon={<CasinoIcon />}
                  >
                    {roll.type}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <TextField
              fullWidth
              margin="normal"
              label="Reason for Roll (optional)"
              value={selectedRoll.reason}
              onChange={(e) => setSelectedRoll(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Strength check, Attack roll"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRollDialogClose}>Cancel</Button>
          <Button 
            onClick={handleRollSubmit}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CasinoIcon />}
          >
            Roll
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
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GameSession; 