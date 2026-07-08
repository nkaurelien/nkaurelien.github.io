type Profile @table {
  name: String!
  bioSummary: String!
  email: String!
  githubUrl: String
  linkedinUrl: String
}

type ContentSection @table {
  title: String!
  category: String! # "ABOUT", "PROJECT", ou "EXPERIENCE"
  description: String
}

type ContentEntry @table {
  rawMarkdown: String!
  slug: String
  publishDate: Date
  section: ContentSection!
}

type VectorEmbedding @table {
  textChunk: String!
  embeddingVector: Vector @col(size: 1536)
  contentEntry: ContentEntry!
}

type Tag @table {
  name: String!
  colorCode: String
}

# Table de liaison pour les relations Many-to-Many entre Contenu et Tags
type ContentTag @table(key: ["contentEntry", "tag"]) {
  contentEntry: ContentEntry!
  tag: Tag!
}
