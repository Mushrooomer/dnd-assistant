import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  MenuItem,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { characters } from '../../services/api';

const races = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 
  'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'
];

const classes = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard'
];

const backgrounds = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage',
  'Soldier', 'Charlatan', 'Entertainer', 'Guild Artisan',
  'Hermit', 'Outlander', 'Sailor'
];

const alignments = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

const steps = ['Basic Info', 'Ability Scores', 'Equipment & Features'];

const CharacterCreation: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [character, setCharacter] = useState({
    name: '',
    race: '',
    class: '',
    background: '',
    alignment: '',
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    hitPoints: 10,
    maxHitPoints: 10,
    armorClass: 10,
    proficiencies: [] as string[],
    equipment: [] as string[],
    features: [] as string[]
  });

  const handleChange = (field: string, value: any) => {
    setCharacter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatsChange = (stat: string, value: number) => {
    setCharacter(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: value
      }
    }));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await characters.create(character);
      navigate('/characters');
    } catch (error: any) {
      console.error('Error creating character:', error);
      setError(error.response?.data?.message || 'Failed to create character');
    }
  };

  const renderBasicInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Character Name"
          value={character.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Race</InputLabel>
          <Select
            value={character.race}
            label="Race"
            onChange={(e) => handleChange('race', e.target.value)}
            required
          >
            {races.map((race) => (
              <MenuItem key={race} value={race}>{race}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Class</InputLabel>
          <Select
            value={character.class}
            label="Class"
            onChange={(e) => handleChange('class', e.target.value)}
            required
          >
            {classes.map((cls) => (
              <MenuItem key={cls} value={cls}>{cls}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Background</InputLabel>
          <Select
            value={character.background}
            label="Background"
            onChange={(e) => handleChange('background', e.target.value)}
            required
          >
            {backgrounds.map((bg) => (
              <MenuItem key={bg} value={bg}>{bg}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Alignment</InputLabel>
          <Select
            value={character.alignment}
            label="Alignment"
            onChange={(e) => handleChange('alignment', e.target.value)}
            required
          >
            {alignments.map((align) => (
              <MenuItem key={align} value={align}>{align}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderAbilityScores = () => (
    <Grid container spacing={3}>
      {Object.entries(character.stats).map(([stat, value]) => (
        <Grid item xs={12} sm={6} md={4} key={stat}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              {stat}
            </Typography>
            <TextField
              type="number"
              value={value}
              onChange={(e) => handleStatsChange(stat, parseInt(e.target.value) || 0)}
              inputProps={{ min: 3, max: 18 }}
              sx={{ width: '100px' }}
            />
            <Typography variant="caption" display="block">
              Modifier: {Math.floor((value - 10) / 2)}
            </Typography>
          </Paper>
        </Grid>
      ))}
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Hit Points"
              value={character.hitPoints}
              onChange={(e) => handleChange('hitPoints', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Max Hit Points"
              value={character.maxHitPoints}
              onChange={(e) => handleChange('maxHitPoints', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Armor Class"
              value={character.armorClass}
              onChange={(e) => handleChange('armorClass', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  const renderEquipmentAndFeatures = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Proficiencies (one per line)"
          value={character.proficiencies.join('\n')}
          onChange={(e) => handleChange('proficiencies', e.target.value.split('\n'))}
          placeholder="Enter proficiencies, one per line"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Equipment (one per line)"
          value={character.equipment.join('\n')}
          onChange={(e) => handleChange('equipment', e.target.value.split('\n'))}
          placeholder="Enter equipment, one per line"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Features (one per line)"
          value={character.features.join('\n')}
          onChange={(e) => handleChange('features', e.target.value.split('\n'))}
          placeholder="Enter features, one per line"
        />
      </Grid>
    </Grid>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderAbilityScores();
      case 2:
        return renderEquipmentAndFeatures();
      default:
        return 'Unknown step';
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return character.name && character.race && character.class && 
               character.background && character.alignment;
      case 1:
        return Object.values(character.stats).every(stat => stat >= 3 && stat <= 18) &&
               character.hitPoints > 0 && character.maxHitPoints > 0 && character.armorClass > 0;
      case 2:
        return character.proficiencies.length > 0 && 
               character.equipment.length > 0 && 
               character.features.length > 0;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Character
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            onClick={() => navigate('/characters')}
            sx={{ mr: 'auto' }}
          >
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepComplete(activeStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isStepComplete(activeStep)}
            >
              Create Character
            </Button>
          )}
        </Box>
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

export default CharacterCreation; 