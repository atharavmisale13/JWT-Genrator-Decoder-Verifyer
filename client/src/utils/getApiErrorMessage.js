export function getApiErrorMessage(error, fallbackMessage) {
  return (
    error.response?.data?.error?.message ||
    error.message ||
    fallbackMessage
  );
}