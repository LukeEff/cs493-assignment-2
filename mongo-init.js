db.createUser(
    {
      user: "root",
      pwd: "letmein",
      roles: [
        {
          role: "readWrite",
          db: "businessEcosystemDB"
        }
      ]
    }
);
