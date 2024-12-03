const fs = require('fs');
const csv = require('csv-parser');

// Function to generate random ID
const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
};

// Column name constants
const COLUMN_NAMES = {
  status: "Status",
  color: "Status Color",
  rootTag: "RootTag",
  subTag1: "SubTag 1",
  subTag2: "SubTag 2",
  noteContent: "Note", // Add your CSV column name for note content
};

const processCsvAndGenerateJson = (csvFilePath, outputCtgoPath, outputJsonPath) => {
  const jsonData = {
    templateDocument: {
      actors: [],
      companyId: "",
      count: 0,
      groupBy: "",
      advancedSetup: false,
      isHideInAppEnabled: false,
      dataContent: [],
      labelGroups: [
        {
          title: "Status",
          labels: [],
        },
      ],
      tags: [
        {
          id: generateRandomId(),
          title: "Template",
          childIds: [],
          root: true,
          noteCounts: {},
          guidance: { text: "", image: "" },
        },
      ],
      notes: [], // Array to store notes
    },
    created: Date.now(),
  };

  const labelsSet = new Set();
  const tagsMap = {}; // Map to store hierarchy by title and their IDs
  const labelMap = {}; // Map to link status titles to label IDs

  // Read and process the CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: ';' }))
    .on('data', (row) => {
      const normalizedRow = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[key.trim()] = row[key];
      });

      const status = normalizedRow[COLUMN_NAMES.status]?.trim();
      const color = normalizedRow[COLUMN_NAMES.color]?.trim();
      const rootTagTitle = normalizedRow[COLUMN_NAMES.rootTag]?.trim();
      const subTag1Title = normalizedRow[COLUMN_NAMES.subTag1]?.trim() || null;
      const subTag2Title = normalizedRow[COLUMN_NAMES.subTag2]?.trim() || null;
      const noteContent = normalizedRow[COLUMN_NAMES.noteContent]?.trim() || null;

      // Add unique labels
      if (status && color && !labelsSet.has(status)) {
        labelsSet.add(status);
        const labelId = generateRandomId();
        labelMap[status] = labelId; // Store label ID for linking notes
        jsonData.templateDocument.labelGroups[0].labels.push({
          title: status,
          color: color,
          id: labelId,
        });
      }

      // Generate hierarchical tags
      let currentTag = null;
      if (rootTagTitle) {
        if (!tagsMap[rootTagTitle]) {
          const rootTagId = generateRandomId();
          const rootTag = {
            id: rootTagId,
            title: rootTagTitle,
            childIds: [],
            root: false,
            noteCounts: {},
            guidance: { text: "", image: "" },
          };
          tagsMap[rootTagTitle] = rootTag;
          jsonData.templateDocument.tags.push(rootTag);
          jsonData.templateDocument.tags[0].childIds.push(rootTagId);
        }
        currentTag = tagsMap[rootTagTitle];

        if (subTag1Title) {
          if (!tagsMap[subTag1Title]) {
            const subTag1Id = generateRandomId();
            const subTag1 = {
              id: subTag1Id,
              title: subTag1Title,
              childIds: [],
              root: false,
              noteCounts: {},
              guidance: { text: "", image: "" },
            };
            tagsMap[subTag1Title] = subTag1;
            jsonData.templateDocument.tags.push(subTag1);
            currentTag.childIds.push(subTag1Id);
          }
          currentTag = tagsMap[subTag1Title];

          if (subTag2Title) {
            if (!tagsMap[subTag2Title]) {
              const subTag2Id = generateRandomId();
              const subTag2 = {
                id: subTag2Id,
                title: subTag2Title,
                childIds: [],
                root: false,
                noteCounts: {},
                guidance: { text: "", image: "" },
              };
              tagsMap[subTag2Title] = subTag2;
              jsonData.templateDocument.tags.push(subTag2);
              currentTag.childIds.push(subTag2Id);
            }
            currentTag = tagsMap[subTag2Title];
          }
        }
      }

      // Add notes if content exists
      if (noteContent && currentTag && status) {
        const noteId = generateRandomId();
        const labelId = labelMap[status];
        jsonData.templateDocument.notes.push({
          id: noteId,
          tagId: currentTag.id,
          labelId: labelId,
          copy: noteContent,
          order: Date.now(),
          updated: Date.now(),
        });

        // Update noteCounts for the tag
        if (!currentTag.noteCounts[labelId]) {
          currentTag.noteCounts[labelId] = 0;
        }
        currentTag.noteCounts[labelId]++;
      }
    })
    .on('end', () => {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const base64Data = Buffer.from(jsonString).toString('base64');

      fs.writeFile(outputJsonPath, jsonString, (err) => {
        if (err) console.error("Error writing JSON file:", err);
        else console.log("JSON file saved to", outputJsonPath);
      });

      fs.writeFile(outputCtgoPath, base64Data, (err) => {
        if (err) console.error("Error writing .ctgo file:", err);
        else console.log(".ctgo file saved to", outputCtgoPath);
      });
    })
    .on('error', (err) => {
      console.error("Error reading CSV file:", err);
    });
};

// Usage
const csvFilePath = '/Users/gustavbrath/Downloads/script.csv'; // Update your file path
const outputCtgoPath = '/Users/gustavbrath/Desktop/Template.ctgo';
const outputJsonPath = '/Users/gustavbrath/Desktop/Template.json';
processCsvAndGenerateJson(csvFilePath, outputCtgoPath, outputJsonPath);
module.exports = { processCsvAndGenerateJson };
