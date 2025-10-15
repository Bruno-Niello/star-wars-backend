import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Movie {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { unique: true })
  title: string;

  @Column("text")
  director: string;

  @Column("text")
  release_date: string;

  @Column("text", { nullable: true })
  swapi_url: string;

  @Column({ type: "text", nullable: true })
  opening_crawl: string;

  @Column({ type: "text", nullable: true })
  producer: string;

  @Column({ type: "int", nullable: true })
  episode_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
