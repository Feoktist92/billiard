import React, { useState } from 'react';

interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onColorChange: (color: string) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    isOpen,
    onClose,
    onColorChange,
}) => {
    const [selectedColor, setSelectedColor] = useState('#000000');

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedColor(e.target.value);
        onColorChange(e.target.value);
    };

    if (!isOpen) return null;

    return (
        <div className='color-picker-modal'>
            <div className='modal'>
                <span onClick={onClose} className='close'>
                    &times;
                </span>
                <label className='color-picker'>
                    <span> Выберите цвет:</span>
                    <input
                        type='color'
                        value={selectedColor}
                        onChange={handleColorChange}
                    />
                </label>
            </div>
        </div>
    );
};

export default ColorPickerModal;

