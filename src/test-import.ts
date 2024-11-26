import { exportComments } from "./utils/export.js";
import { importComments } from "./utils/import.js";

const testComment = {
  id: "test-1",
  userId: "user-1",
  timestamp: Date.now(),
  contentHash: "hash1",
  content: 'Test content with special chars: < > & "',
  attachments: [
    {
      name: "test.png",
      url: "data:image/png;base64,test==",
      type: "image/png",
      file: new File([], "test.png"),
    },
  ],
  children: [],
};

async function test() {
  const xml = await exportComments([testComment], "xml");
  console.log("Exported XML:", xml);
  console.log("\nImporting back...");
  const imported = importComments(xml, "xml");
  console.log("Imported result:", JSON.stringify(imported, null, 2));
}

test();
