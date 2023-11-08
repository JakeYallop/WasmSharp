import { TextTag } from "./TextTags";

/**
 * Immutable abstract representation of a span of text.  For example, in an error diagnostic that reports a
 * location, it could come from a parsed string, text from a tool editor buffer, etc.
 */
export type Span = {
  start: number;
  end: number;
  length: number;
  isEmpty: boolean;
};

export type CompletionTag = "Public" | TextTag;
