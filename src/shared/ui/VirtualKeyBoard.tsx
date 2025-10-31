import React from 'react';

const defaultKeys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '0', 'Backspace', 'Done'
];

interface VirtualKeyboardProps {
    onKeyPress: (value: string) => void;
    onDone?: () => void;
    targetValue: string;
    keys?: string[];
}

export default function VirtualKeyboard({ onKeyPress, onDone, targetValue, keys = defaultKeys }: VirtualKeyboardProps): React.ReactNode {

    const handleKeyClick = (key: string) => {
        if (key === 'Backspace') {
            onKeyPress(targetValue.slice(0, -1));
        } else if (key === 'Done') {
            onDone?.();
        } else {
            onKeyPress(targetValue + key);
        }
    };

    return (
        <div className="keyboard-container">
            <div className="keyboard-grid">
                {keys.map((key) => (
                    <button
                        key={key}
                        className={`key-button ${key === 'Backspace' ? 'key-backspace' : ''} ${key === 'Done' ? 'key-done' : ''}`}
                        onClick={() => handleKeyClick(key)}
                        type="button"
                    >
                        {key === 'Backspace' ? '⌫' : key}
                    </button>
                ))}
            </div>
        </div>
    );
}
