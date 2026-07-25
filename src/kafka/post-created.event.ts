export interface PostCreatedEvent {
    postId: string;
    authorId: string;
    createdAt: Date;
}