import { useState, useCallback } from 'react';
import styles from './Admin.module.css';

export function useAdminMessage() {
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }, []);

  const MessageDisplay = useCallback(() => {
    if (!message.text) return null;
    return <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>;
  }, [message]);

  return { message, showMessage, MessageDisplay };
}
