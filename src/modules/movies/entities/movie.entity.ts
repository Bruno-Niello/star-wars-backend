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
  swapi_id: string;

  @Column({ type: "text", nullable: true })
  opening_crawl: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
