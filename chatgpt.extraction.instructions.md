Please finish the function in `extractors/chatgpt.mjs` It should run in the browser and extract infromation information from the DOM into an array of Javascript Objects (with binary content represented as a base64 data url, if possible).

An example of the HTML page upon which this will be run can be found in `extractors/chatgpt.html`

The extracted format should be in the format described in `conversation-format.md`

Keep in mind that the code may be purposefully obfuscated or dynamicalally generated, so try to use selectors that are unlikely to change.

Note that `extractors/claude.mjs` was written to extract similar information from `extractors/claude.html`. You should used that for inspiration.


## Consider before you start

1. Are you able to extract it's basic components?

- message content
- message metadata
  - timestamps
  - user id
  - user type (assistant, user, system)
  - (anything else?)
- (anything else?)

1. Are you able to extract additional components such as:

- embedded widgets and functions
- code blocks
- artifacts/canvases
- attached files
- can you access the binary content?
- (anything else?)

## Details

This is the function signature:

```typescript
const extractMessages = async (): Promise<Message[]> => {
  const messages = [];
  // no inputs needed as dom is in closure
  // your code here
  return messages;
}
```

It will be used like this:

```javascript
const messages = await extractMessages();
console.log(messages);
```
