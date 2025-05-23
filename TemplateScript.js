const fs = require("fs");
const csv = require("csv-parser");

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
  noteContent: "Note",
};

const processCsvAndGenerateFiles = (csvFilePath, outputCtgoPath, outputJsonPath, generateJson) => {
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
      notes: [],
    },
    created: Date.now(),
  };

  const labelsSet = new Set();
  const tagsMap = {};
  const labelMap = {};

  const generateTagKey = (root, sub1, sub2) => `${root}||${sub1 || ""}||${sub2 || ""}`;

  // Read and process the CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv({ separator: "," }))
    .on("data", (row) => {
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

      if (status && color && !labelsSet.has(status)) {
        labelsSet.add(status);
        const labelId = generateRandomId();
        labelMap[status] = labelId;
        jsonData.templateDocument.labelGroups[0].labels.push({
          title: status,
          color: color,
          id: labelId,
        });
      }

      let currentTag = tagsMap["Template"];
      const rootTagKey = generateTagKey(rootTagTitle);
      if (rootTagTitle && !tagsMap[rootTagKey]) {
        const rootTagId = generateRandomId();
        const rootTag = {
          id: rootTagId,
          title: rootTagTitle,
          childIds: [],
          root: false,
          noteCounts: {},
          guidance: { text: "", image: "" },
        };
        tagsMap[rootTagKey] = rootTag;
        jsonData.templateDocument.tags.push(rootTag);
        jsonData.templateDocument.tags[0].childIds.push(rootTagId);
      }
      currentTag = tagsMap[rootTagKey];

      if (subTag1Title) {
        const subTag1Key = generateTagKey(rootTagTitle, subTag1Title);
        if (!tagsMap[subTag1Key]) {
          const subTag1Id = generateRandomId();
          const subTag1 = {
            id: subTag1Id,
            title: subTag1Title,
            childIds: [],
            root: false,
            noteCounts: {},
            guidance: { text: "", image: "" },
          };
          tagsMap[subTag1Key] = subTag1;
          jsonData.templateDocument.tags.push(subTag1);
          currentTag.childIds.push(subTag1Id);
        }
        currentTag = tagsMap[subTag1Key];

        if (subTag2Title) {
          const subTag2Key = generateTagKey(rootTagTitle, subTag1Title, subTag2Title);
          if (!tagsMap[subTag2Key]) {
            const subTag2Id = generateRandomId();
            const subTag2 = {
              id: subTag2Id,
              title: subTag2Title,
              childIds: [],
              root: false,
              noteCounts: {},
              guidance: { text: "", image: "" },
            };
            tagsMap[subTag2Key] = subTag2;
            jsonData.templateDocument.tags.push(subTag2);
            currentTag.childIds.push(subTag2Id);
          }
          currentTag = tagsMap[subTag2Key];
        }
      }

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

        if (!currentTag.noteCounts[labelId]) {
          currentTag.noteCounts[labelId] = 0;
        }
        currentTag.noteCounts[labelId]++;
      }
    })
    .on("end", () => {
      const base64Data = Buffer.from(JSON.stringify(jsonData)).toString("base64");

      fs.writeFile(outputCtgoPath, base64Data, (err) => {
        if (err) console.error("Error writing .ctgo file:", err);
        else console.log(".ctgo file saved to", outputCtgoPath);
      });

      if (generateJson) {
        fs.writeFile(outputJsonPath, JSON.stringify(jsonData, null, 2), (err) => {
          if (err) console.error("Error writing JSON file:", err);
          else console.log("JSON file saved to", outputJsonPath);
        });
      }
    })
    .on("error", (err) => {
      console.error("Error reading CSV file:", err);
    });
};

module.exports = { processCsvAndGenerateFiles };
