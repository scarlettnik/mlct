import { render, screen, fireEvent } from '@testing-library/react';
import VirtualKeyboard from '../VirtualKeyBoard';

describe('VirtualKeyboard', () => {
    const mockOnKeyPress = jest.fn();
    const mockOnDone = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all keys including special keys', () => {
        render(<VirtualKeyboard onKeyPress={mockOnKeyPress} targetValue="" />);
        
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫', 'Done'].forEach(key => {
            expect(screen.getByText(key)).toBeInTheDocument();
        });
    });

    it('calls onKeyPress with new character when a number is clicked', () => {
        render(<VirtualKeyboard onKeyPress={mockOnKeyPress} targetValue="12" />);
        
        fireEvent.click(screen.getByText('3'));
        expect(mockOnKeyPress).toHaveBeenCalledWith('123');
    });

    it('calls onKeyPress with sliced value when Backspace is clicked', () => {
        render(<VirtualKeyboard onKeyPress={mockOnKeyPress} targetValue="123" />);
        
        fireEvent.click(screen.getByText('⌫'));
        expect(mockOnKeyPress).toHaveBeenCalledWith('12');
    });

    it('calls onDone when Done is clicked', () => {
        render(<VirtualKeyboard onKeyPress={mockOnKeyPress} onDone={mockOnDone} targetValue="123" />);
        
        fireEvent.click(screen.getByText('Done'));
        expect(mockOnDone).toHaveBeenCalledTimes(1);
    });

    it('handles Backspace on empty value', () => {
        render(<VirtualKeyboard onKeyPress={mockOnKeyPress} targetValue="" />);
        
        fireEvent.click(screen.getByText('⌫'));
        expect(mockOnKeyPress).toHaveBeenCalledWith('');
    });
});
