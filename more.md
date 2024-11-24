Let's think of ways that we could improve this...
I addition to the main textual content, comments should have:

## Comment Content and Metadata

1.  - an associate user id
2.  - a timestamp
3.  - associated content hash
4.  - an array of attachments -- if the attachment in an image, it's rendered
5.  - any other metadata that makes sense

## Complex Textual Representation

The text representation currently just represents the content. We should have it in a representation like this, similar to a HTTP request:

```
User-Id: <user id>
Hash: <content hash>
Timestamp: <timestamp>

<content>
```

Replies can still be nested using indentation and attachments are represented similar to multipart http requests using a random Boundary header.

## Live Preview

There should be a way to live preview the textual format in addition to being abot to download it.

In addition to the textual representation, there should be a way to export the comments as a JSON object and an XML object.
