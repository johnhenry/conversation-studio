# Comment Manager

This is a simple comment manager that allows you to add, delete, view, rearrange, and export comments.

## Features

- **Add, Delete, View Comments:** Basic comment management functionalities.
- **Rearrange Comments:** Drag and drop comments to create replies or move them to the top level. Comments below the top level have a button to move them up a level. All replies move with their parent comment.
- **Comment Metadata:** Comments now include associated user ID, timestamp, and content hash.
- **Export Options:** Export comments in various formats:
  - **Text:** A nested textual representation, including metadata and attachments.
  - **JSON:** A JSON object representing the comment structure.
  - **XML:** An XML document representing the comment structure.
- **Live Preview and Download:** Preview and download exported data in Text, JSON, or XML formats.
- **User ID Input:** Specify a user ID when adding a comment. A random ID is generated if left blank.
- **Attachment Uploads:** Upload, view, and remove attachments before posting a comment. Images are rendered in the preview.

## Arrangement

New comments are added to the top level.
You can drag and drop comments onto other comments to create replies. Dragging a comment onto the background moves it to the top level. If a comment is dragged onto one of its own replies (or sub-replies), nothing happens.

Comment's below the top level have a button that can be pressed to move them up a level

Whenever a comment moves, all of its replies move with it.

## Rendering

Comments are rendered as HTML using Markdown. A "Preview" view lets you see the rendered Markdown before posting.

## Exporting

The application now features four tabs: "Arrange", "Text", "JSON", and "XML". Clicking on a tab displays the corresponding view. The "Text", "JSON", and "XML" tabs provide download buttons to export the comments in the respective format.
