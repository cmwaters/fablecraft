import type { DocumentSnapshot } from "../domain/document/types";

// Generated from src/site/tutorial.fable by npm run tutorial:sync.
// Edit the .fable file, then rerun the sync command.
export const WEBSITE_TUTORIAL_SNAPSHOT = {
  "summary": {
    "documentId": "05a4345d-2789-4e91-a8e2-49d91b1573b3",
    "name": "tutorial",
    "openedAtMs": 1777466004384,
    "path": "/demo/tutorial.fable"
  },
  "cards": [
    {
      "documentId": "05a4345d-2789-4e91-a8e2-49d91b1573b3",
      "id": "card-4814fe7a-813e-4c7d-945d-403fa87061fd",
      "orderIndex": 0,
      "parentId": null,
      "type": "card"
    },
    {
      "documentId": "05a4345d-2789-4e91-a8e2-49d91b1573b3",
      "id": "card-75f80907-d7ae-4759-9063-92bf28a664bc",
      "orderIndex": 0,
      "parentId": "card-4814fe7a-813e-4c7d-945d-403fa87061fd",
      "type": "card"
    },
    {
      "documentId": "05a4345d-2789-4e91-a8e2-49d91b1573b3",
      "id": "8af87b5d-d5d5-46f5-967e-94b427f729a2",
      "orderIndex": 0,
      "parentId": "card-75f80907-d7ae-4759-9063-92bf28a664bc",
      "type": "card"
    }
  ],
  "contents": [
    {
      "cardId": "8af87b5d-d5d5-46f5-967e-94b427f729a2",
      "contentJson": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Your story starts here…\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Welcome to \"},{\"type\":\"text\",\"marks\":[{\"type\":\"bold\"}],\"text\":\"Fablecraft\"},{\"type\":\"text\",\"text\":\" - a heirarchical text editor for structuring ideas into stories\"},{\"type\":\"hardBreak\"},{\"type\":\"hardBreak\"},{\"type\":\"text\",\"text\":\"Explore Fablecraft by navigating through each of the cards:\"}]},{\"type\":\"bulletList\",\"content\":[{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"marks\":[{\"type\":\"bold\"}],\"text\":\"→\"},{\"type\":\"text\",\"text\":\" dive into the first child\"}]}]},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"marks\":[{\"type\":\"bold\"}],\"text\":\"←\"},{\"type\":\"text\",\"text\":\" rise to the parent\"}]}]},{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"marks\":[{\"type\":\"bold\"}],\"text\":\"↑ ↓\"},{\"type\":\"text\",\"text\":\" step between siblings\"}]}]}]},{\"type\":\"paragraph\"}]}"
    },
    {
      "cardId": "card-4814fe7a-813e-4c7d-945d-403fa87061fd",
      "contentJson": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}"
    },
    {
      "cardId": "card-75f80907-d7ae-4759-9063-92bf28a664bc",
      "contentJson": "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}"
    }
  ],
  "revisions": []
} satisfies DocumentSnapshot;
