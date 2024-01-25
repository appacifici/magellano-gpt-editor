## Team di una nazione
```typescript
db('livescore').collection('teams').aggregate([
  {
    $lookup: {
      from: "countries", // the name of the collection to join with
      localField: "countryId", // the field from the 'teams' collection
      foreignField: "_id", // the corresponding field in the 'country' collection
      as: "country_info" // the name of the new array field to add to the output documents
    }
  },
  { 
    $match: {
      "country_info.name": "Italy" // Filters documents to pass only those that have "Italy" as the country name
    }
  },
  { $limit: 100 }
]).toArray()
``````