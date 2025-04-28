import { H3Event } from "h3";
import busboy from "busboy";
import { FileInfo } from "busboy";

interface MultipartPart {
  name: string;
  filename?: string;
  type?: string;
  data: Buffer;
}

export const readMultipartFormData = (
  event: H3Event
): Promise<MultipartPart[]> => {
  return new Promise((resolve, reject) => {
    const parts: MultipartPart[] = [];
    const bb = busboy({ headers: event.node.req.headers });

    bb.on(
      "file",
      (name: string, file: NodeJS.ReadableStream, info: FileInfo) => {
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];

        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });

        file.on("end", () => {
          parts.push({
            name,
            filename,
            type: mimeType,
            data: Buffer.concat(chunks),
          });
        });
      }
    );

    bb.on("field", (name: string, val: string) => {
      parts.push({
        name,
        data: Buffer.from(val),
      });
    });

    bb.on("finish", () => {
      resolve(parts);
    });

    bb.on("error", (error: Error) => {
      reject(error);
    });

    event.node.req.pipe(bb);
  });
};
