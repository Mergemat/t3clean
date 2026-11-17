export function ComposerPromptLengthValidation({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="px-2 pb-2 text-meta text-destructive sm:px-4"
      data-chat-composer-validation="prompt-length"
    >
      {message}
    </p>
  );
}
