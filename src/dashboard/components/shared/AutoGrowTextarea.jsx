import { useId, useLayoutEffect, useRef, useState } from 'react';

function resizeTextarea(textarea) {
  textarea.style.height = 'auto';
  const height = Math.min(Math.max(textarea.scrollHeight, 140), 320);
  textarea.style.height = `${height}px`;
  textarea.style.overflowY = textarea.scrollHeight > 320 ? 'auto' : 'hidden';
}

export default function AutoGrowTextarea({ value, defaultValue, onChange, className = '', id, ...props }) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const textareaRef = useRef(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
  const text = isControlled ? value ?? '' : uncontrolledValue;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    resizeTextarea(textarea);
  }, [text]);

  const handleChange = event => {
    if (!isControlled) setUncontrolledValue(event.target.value);
    resizeTextarea(event.currentTarget);
    onChange?.(event);
  };

  return (
    <div className="admin-notes-editor">
      <textarea
        {...props}
        ref={textareaRef}
        id={textareaId}
        className={`admin-notes-textarea ${className}`.trim()}
        value={isControlled ? text : undefined}
        defaultValue={isControlled ? undefined : defaultValue}
        onChange={handleChange}
        aria-describedby={`${textareaId}-count`}
      />
      <div id={`${textareaId}-count`} className="admin-notes-counter" aria-live="polite">
        {text.length} characters
      </div>
    </div>
  );
}
