using Microsoft.EntityFrameworkCore;
using TranslationSystemAPI.Models.Entities;

namespace TranslationSystemAPI.Data
{
    public class TranslationDbContext : DbContext
    {
        public TranslationDbContext(DbContextOptions<TranslationDbContext> options) 
            : base(options)
        {
        }

        public DbSet<Story> Stories { get; set; }
        public DbSet<Chapter> Chapters { get; set; }
        public DbSet<Segment> Segments { get; set; }
        public DbSet<Glossary> Glossaries { get; set; }
        
        // THÊM 2 BẢNG CHO KNOWLEDGE GRAPH
        public DbSet<LoreEntity> LoreEntities { get; set; }
        public DbSet<LoreRelationship> LoreRelationships { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Chapter>()
                .HasOne(c => c.Story)
                .WithMany(s => s.Chapters)
                .HasForeignKey(c => c.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Segment>()
                .HasOne(s => s.Chapter)
                .WithMany(c => c.Segments)
                .HasForeignKey(s => s.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Glossary>()
                .HasOne(g => g.Story)
                .WithMany(s => s.Glossaries)
                .HasForeignKey(g => g.StoryId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Chapter>()
                .HasIndex(c => new { c.StoryId, c.ChapterNumber })
                .IsUnique(); 

            modelBuilder.Entity<Segment>()
                .HasIndex(s => new { s.ChapterId, s.OrderIndex })
                .IsUnique();

            // ==========================================
            // CẤU HÌNH FLUENT API CHO LORE GRAPH
            // ==========================================
            modelBuilder.Entity<LoreRelationship>(entity =>
            {
                // Cho phép xóa truyện thì xóa luôn Relationships
                entity.HasOne(r => r.Story)
                    .WithMany()
                    .HasForeignKey(r => r.StoryId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Quan hệ Nguồn (BẮT BUỘC DÙNG RESTRICT)
                entity.HasOne(r => r.SourceEntity)
                    .WithMany(e => e.OutgoingRelationships)
                    .HasForeignKey(r => r.SourceEntityId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Quan hệ Đích (BẮT BUỘC DÙNG RESTRICT)
                entity.HasOne(r => r.TargetEntity)
                    .WithMany(e => e.IncomingRelationships)
                    .HasForeignKey(r => r.TargetEntityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}