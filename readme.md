# Comment Manager

This is a simple comment manager that allows you to add, delete, view, and (re)arrange comments.

## Arrangement

New comments are added to the top level.
You can drag and drop comments onto other comments to create replies. Dragging a comment onto the background moves it to the top level. If a comment is dragged onto one of its own replies (or sub-replies), nothing happens.

Comment's below the top level have a button that can be pressed to move them up a level

Whenever a comment moves, all of its replies move with it.

## Rendering

Comments are rendered as HTML using Markdown.

In addition to the standard "Edit" view for editing raw Markdown before posting, there's a "Preview" view that lets you see the rendered Markdown before posting.

An export button allows you to export the comments as a nested textual representation.
