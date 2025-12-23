
interface PlayerNameInputProps {
  value: string; 
  onChange: (value: string) => void;
}

export default function PlayerNameInput({ 
  value,
  onChange 
}: PlayerNameInputProps) {
  return (
    <div className="playerNameInput" style={{ width: '10%' }}>
      <label htmlFor="player-name" className="playerNameLabel">
        Nom du joueur
      </label>
      <input
        id="player-name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="playerNameInputField"
        placeholder="Entrez votre nom"
        aria-label="Nom du joueur"
      />
    </div>
  );
}