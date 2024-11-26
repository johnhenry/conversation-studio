# Conversation Studio

This is a simple comment manager that allows you to add, delete, view, rearrange, and export comments.

## Features

- **Add, Delete, View Comments:** Basic comment management functionalities. You can now add comments with attachments only, even without content.
- **Rearrange Comments:** Drag and drop comments to create replies or move them to the top level. Comments below the top level have a button to move them up a level. All replies move with their parent comment.
- **Comment Metadata:** Comments now include associated user ID, timestamp, and content hash.
- **Export and Download Options:** Export and download comments in various formats:
  - **Text:** A nested textual representation, including metadata and attachments. Attachments are encoded using base64.
  - **JSON:** A JSON object representing the comment structure. Attachments are encoded using base64.
  - **XML:** An XML document representing the comment structure. Attachments are encoded using base64.
- **Preview Options:** Preview the comment before posting in the following formats:
  - **Preview:** Renders the comment as it would appear in the Arrange view.
  - **Preview Text:** Displays the comment in the Text export format.
  - **Preview JSON:** Displays the comment in the JSON export format.
  - **Preview XML:** Displays the comment in the XML export format.
- **Live Preview and Download:** Preview and download exported data in Text, JSON, or XML formats. The textarea for exported data now dynamically resizes to fit the content. The download button is located below the exported data.
- **User ID Input:** Specify a user ID when adding a comment. A random ID is generated if left blank. The User ID input is only visible in the Edit view.
- **Attachment Uploads:** Upload, view, and remove attachments before posting a comment. Images are rendered in the preview if they are common image formats (png, jpg, jpeg, gif, svg, webp), otherwise an icon is displayed. Attachments have an optional name.
- **Disabled Add Comment Button:** The Add Comment button is disabled when both the content box is empty and no attachments are present.

## Arrangement

New comments are added to the top level.
You can drag and drop comments onto other comments to create replies. Dragging a comment onto the background moves it to the top level. If a comment is dragged onto one of its own replies (or sub-replies), nothing happens.

Comment's below the top level have a button that can be pressed to move them up a level

Whenever a comment moves, all of its replies move with it.

## Rendering

Comments are rendered as HTML using Markdown. A "Preview" view lets you see the rendered Markdown before posting. Attachments are rendered as images if they are common image formats, otherwise an icon is displayed.

## Exporting

The application now features four tabs: "Arrange", "Text", "JSON", and "XML". Clicking on a tab displays the corresponding view. The "Text", "JSON", and "XML" tabs provide download buttons to export the comments in the respective format. The download button is located below the exported data.
