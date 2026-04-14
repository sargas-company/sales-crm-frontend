const parseServerError = (error: unknown): string => {
  const data = (error as any)?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (Array.isArray(data.message)) return data.message[0];
  if (typeof data.message === "string") return data.message;
  return "Something went wrong. Please try again.";
};

export default parseServerError;
