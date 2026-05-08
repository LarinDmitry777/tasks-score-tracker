import { useEffect, useRef, useState } from 'react';
import s from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function Modal({ open, title, placeholder, initialValue, onSave, onClose }: ModalProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue ?? '');
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialValue]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.sheet}>
        <div className={s.handle} />
        <p className={s.title}>{title}</p>
        <input
          ref={inputRef}
          className={s.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={60}
        />
        <button
          className={s.saveBtn}
          onClick={handleSave}
          disabled={!value.trim()}
          type="button"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
