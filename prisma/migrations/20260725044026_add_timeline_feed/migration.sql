-- CreateTable
CREATE TABLE "TimelineFeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimelineFeed_userId_createdAt_idx" ON "TimelineFeed"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TimelineFeed_userId_postId_key" ON "TimelineFeed"("userId", "postId");

-- AddForeignKey
ALTER TABLE "TimelineFeed" ADD CONSTRAINT "TimelineFeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineFeed" ADD CONSTRAINT "TimelineFeed_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
