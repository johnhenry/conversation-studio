import { exportComments } from "./utils/export.js";
import { importComments } from "./utils/import.js";

const testComments = [
  {
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
    children: [
      {
        id: "test-2",
        userId: "user-2",
        timestamp: Date.now(),
        contentHash: "hash2",
        content: "Child comment",
        attachments: [],
        children: [
          {
            id: "test-3",
            userId: "user-3",
            timestamp: Date.now(),
            contentHash: "hash3",
            content: "Nested child comment",
            attachments: [
              {
                name: "nested.jpg",
                url: "data:image/jpeg;base64,test==",
                type: "image/jpeg",
                file: new File([], "nested.jpg"),
              },
            ],
            children: [],
          },
        ],
      },
    ],
  },
];

async function testFormat(format: "text" | "json" | "xml") {
  console.log(`\n=== Testing ${format.toUpperCase()} Format ===\n`);

  const exported = await exportComments(testComments, format);
  console.log(`Exported ${format.toUpperCase()}:`, exported);

  console.log("\nImporting back...");
  const imported = importComments(exported, format);
  console.log("Imported result:", JSON.stringify(imported, null, 2));

  // Basic validation
  console.log("\nValidation:");
  console.log(
    "- Root comments count:",
    imported.length === testComments.length ? "✅" : "❌"
  );
  console.log(
    "- First comment ID:",
    imported[0]?.id === testComments[0]?.id ? "✅" : "❌"
  );
  console.log(
    "- Has child comment:",
    imported[0]?.children?.length === testComments[0]?.children?.length
      ? "✅"
      : "❌"
  );
  console.log(
    "- Has nested child:",
    imported[0]?.children[0]?.children?.length ===
      testComments[0]?.children[0]?.children?.length
      ? "✅"
      : "❌"
  );
}

async function runTests() {
  await testFormat("text");
  await testFormat("json");
  await testFormat("xml");
}

runTests().catch(console.error);
